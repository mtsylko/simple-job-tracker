import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { EntityManager, In, Repository } from 'typeorm';
import {
  normalizeCompanyName,
  type Company,
  type CompanyBlacklist,
  type CompanyDetails,
  type CompanySummary,
  type CreateCompanyInput,
  type UpdateCompanyInput
} from '@job-tracker/shared';
import { JobEntity } from '../jobs/job.entity';
import { CompanyEntity } from './company.entity';
import { apiError } from '../common/errors/api-error';

/** Empty or whitespace-only text collapses to null rather than a blank value. */
function normalizeText(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

function toBlacklist(entity: CompanyEntity): CompanyBlacklist | null {
  return entity.blacklistedAt
    ? {
        reason: entity.blacklistReason,
        blacklistedAt: entity.blacklistedAt.toISOString()
      }
    : null;
}

/** A company's page from its stored row and its applications, newest first. */
function toDetails(
  row: CompanyEntity | null,
  jobs: JobEntity[],
  fallbackName: string
): CompanyDetails {
  return {
    id: row?.id ?? null,
    name: row?.name ?? jobs[0]?.company.trim() ?? fallbackName,
    website: row?.website ?? null,
    notes: row?.notes ?? null,
    isProductCompany: jobs[0]?.isProductCompany ?? null,
    blacklist: row ? toBlacklist(row) : null,
    applications: jobs.map((job) => ({
      id: job.id,
      role: job.roleOption?.value ?? null,
      level: job.levelOption?.value ?? null,
      status: job.statusOption
        ? { value: job.statusOption.value, color: job.statusOption.color }
        : null,
      appliedAt: job.appliedAt.toISOString(),
      archived: job.archivedAt !== null
    }))
  };
}

function toResponse(entity: CompanyEntity): Company {
  return {
    id: entity.id,
    name: entity.name,
    blacklist: toBlacklist(entity)
  };
}

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly repository: Repository<CompanyEntity>,
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>
  ) {}

  /** Companies from the user's applications, merged with their stored rows by name. */
  async list(userId: string): Promise<CompanySummary[]> {
    const [jobs, rows] = await Promise.all([
      this.jobRepository.find({
        where: { userId },
        select: {
          id: true,
          company: true,
          isProductCompany: true,
          appliedAt: true,
          roleOption: { id: true, value: true },
          statusOption: { id: true, value: true, color: true }
        },
        relations: { roleOption: true, statusOption: true },
        order: { appliedAt: 'DESC', createdAt: 'DESC' }
      }),
      this.repository.find({ where: { userId } })
    ]);

    const byName = new Map<string, CompanySummary>();

    // Newest first, so the first application seen stands for its company.
    for (const job of jobs) {
      const key = normalizeCompanyName(job.company);
      if (!key) {
        continue;
      }
      const role = job.roleOption?.value;
      const summary = byName.get(key);
      if (summary) {
        summary.applicationCount += 1;
        if (role && !summary.roles.includes(role)) {
          summary.roles.push(role);
        }
        continue;
      }
      byName.set(key, {
        id: null,
        name: job.company.trim(),
        applicationCount: 1,
        lastAppliedAt: job.appliedAt.toISOString(),
        isProductCompany: job.isProductCompany,
        latestStatus: job.statusOption
          ? { value: job.statusOption.value, color: job.statusOption.color }
          : null,
        roles: role ? [role] : [],
        blacklist: null
      });
    }

    for (const row of rows) {
      const summary = byName.get(row.nameNormalized);
      if (summary) {
        // A stored row's name is the one the user chose; it beats any application's spelling.
        summary.id = row.id;
        summary.name = row.name;
        summary.blacklist = toBlacklist(row);
        continue;
      }
      byName.set(row.nameNormalized, {
        id: row.id,
        name: row.name,
        applicationCount: 0,
        lastAppliedAt: null,
        isProductCompany: null,
        latestStatus: null,
        roles: [],
        blacklist: toBlacklist(row)
      });
    }

    return [...byName.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }

  async details(
    userId: string,
    rawName: string
  ): Promise<CompanyDetails | null> {
    const key = normalizeCompanyName(rawName);
    const [jobs, row] = await Promise.all([
      this.jobsFor(this.jobRepository, userId, key),
      this.repository.findOne({ where: { userId, nameNormalized: key } })
    ]);
    if (jobs.length === 0 && !row) {
      return null;
    }
    return toDetails(row, jobs, rawName.trim());
  }

  /** Saves a company's page in one go: its applications first, then its row. */
  async update(
    userId: string,
    input: UpdateCompanyInput
  ): Promise<CompanyDetails | null> {
    const key = normalizeCompanyName(input.company);

    return this.repository.manager.transaction(async (manager) => {
      await manager.query(
        `SELECT pg_advisory_xact_lock(hashtext('companies:' || $1))`,
        [userId]
      );
      const jobRepository = manager.getRepository(JobEntity);
      const repository = manager.getRepository(CompanyEntity);

      const jobs = await this.jobsFor(jobRepository, userId, key);
      let row = await repository.findOne({
        where: { userId, nameNormalized: key }
      });
      if (jobs.length === 0 && !row) {
        return null;
      }

      const now = new Date();
      let name = row?.name ?? jobs[0].company.trim();
      let nameNormalized = key;
      if (input.name !== undefined) {
        name = input.name.trim();
        nameNormalized = normalizeCompanyName(name);
        if (nameNormalized !== key) {
          await this.assertNameFree(manager, userId, nameNormalized);
        }
      }

      const jobChanges: Partial<JobEntity> = {};
      if (
        input.name !== undefined &&
        jobs.some((job) => job.company !== name)
      ) {
        jobChanges.company = name;
      }
      if (
        input.isProductCompany !== undefined &&
        jobs.some((job) => job.isProductCompany !== input.isProductCompany)
      ) {
        jobChanges.isProductCompany = input.isProductCompany;
      }
      if (Object.keys(jobChanges).length > 0) {
        await jobRepository.update(
          { userId, id: In(jobs.map((job) => job.id)) },
          { ...jobChanges, updatedAt: now }
        );
      }

      const next =
        row ?? repository.create({ id: randomUUID(), userId, createdAt: now });
      next.name = name;
      next.nameNormalized = nameNormalized;
      next.website =
        input.website !== undefined
          ? normalizeText(input.website)
          : (row?.website ?? null);
      next.notes =
        input.notes !== undefined
          ? normalizeText(input.notes)
          : (row?.notes ?? null);
      next.blacklistedAt = row?.blacklistedAt ?? null;
      next.blacklistReason = row?.blacklistReason ?? null;
      if (input.blacklisted === true && !next.blacklistedAt) {
        next.blacklistedAt = now;
      }
      if (input.blacklisted === false) {
        next.blacklistedAt = null;
        next.blacklistReason = null;
      }
      if (input.blacklistReason !== undefined && next.blacklistedAt) {
        next.blacklistReason = normalizeText(input.blacklistReason);
      }
      next.updatedAt = now;
      row = await repository.save(next);

      return toDetails(
        row,
        await this.jobsFor(jobRepository, userId, nameNormalized),
        name
      );
    });
  }

  /** Adds a company by hand; one with that name, stored or applied to, is refused. */
  async create(
    userId: string,
    input: CreateCompanyInput
  ): Promise<CompanyDetails> {
    const name = input.name.trim();
    const nameNormalized = normalizeCompanyName(name);

    return this.repository.manager.transaction(async (manager) => {
      await manager.query(
        `SELECT pg_advisory_xact_lock(hashtext('companies:' || $1))`,
        [userId]
      );
      await this.assertNameFree(manager, userId, nameNormalized);

      const now = new Date();
      const blacklisted = input.blacklisted === true;
      const row = await manager.getRepository(CompanyEntity).save({
        id: randomUUID(),
        userId,
        name,
        nameNormalized,
        website: normalizeText(input.website),
        notes: normalizeText(input.notes),
        blacklistedAt: blacklisted ? now : null,
        blacklistReason: blacklisted
          ? normalizeText(input.blacklistReason)
          : null,
        createdAt: now,
        updatedAt: now
      });
      return toDetails(row, [], name);
    });
  }

  /** Deletes a company added by hand; one with applications goes with them, not here. */
  async remove(userId: string, id: string): Promise<boolean> {
    const company = await this.repository.findOne({ where: { id, userId } });
    if (!company) {
      return false;
    }
    if (await this.hasApplicationFor(userId, company.nameNormalized)) {
      throw new ConflictException(
        apiError(
          'COMPANY_HAS_APPLICATIONS',
          'A company with applications cannot be deleted'
        )
      );
    }
    await this.repository.delete({ id, userId });
    return true;
  }

  private async assertNameFree(
    manager: EntityManager,
    userId: string,
    nameNormalized: string
  ): Promise<void> {
    const taken =
      (await manager
        .getRepository(CompanyEntity)
        .exists({ where: { userId, nameNormalized } })) ||
      (await this.hasApplicationFor(
        userId,
        nameNormalized,
        manager.getRepository(JobEntity)
      ));
    if (taken) {
      throw new ConflictException(
        apiError(
          'COMPANY_NAME_TAKEN',
          'A company with this name is already in your list'
        )
      );
    }
  }

  /** Every application to one company, newest first, with what its page shows. */
  private async jobsFor(
    repository: Repository<JobEntity>,
    userId: string,
    nameNormalized: string
  ): Promise<JobEntity[]> {
    const jobs = await repository.find({
      where: { userId },
      relations: { roleOption: true, levelOption: true, statusOption: true },
      order: { appliedAt: 'DESC', createdAt: 'DESC' }
    });
    return jobs.filter(
      (job) => normalizeCompanyName(job.company) === nameNormalized
    );
  }

  async blacklist(
    userId: string,
    rawCompany: string,
    rawReason: string | null | undefined
  ): Promise<Company> {
    const name = rawCompany.trim();
    const nameNormalized = normalizeCompanyName(name);

    const existing = await this.repository.findOne({
      where: { userId, nameNormalized }
    });
    if (existing?.blacklistedAt) {
      throw new ConflictException(
        apiError(
          'COMPANY_ALREADY_BLACKLISTED',
          'This company is already on your blacklist'
        )
      );
    }
    const now = new Date();
    const company =
      existing ??
      this.repository.create({
        id: randomUUID(),
        userId,
        name,
        nameNormalized,
        createdAt: now
      });
    company.blacklistedAt = now;
    company.blacklistReason = normalizeText(rawReason);
    company.updatedAt = now;
    await this.repository.save(company);

    return toResponse(company);
  }

  private async hasApplicationFor(
    userId: string,
    nameNormalized: string,
    jobRepository: Repository<JobEntity> = this.jobRepository
  ): Promise<boolean> {
    const jobs = await jobRepository.find({
      where: { userId },
      select: { id: true, company: true }
    });
    return jobs.some(
      (job) => normalizeCompanyName(job.company) === nameNormalized
    );
  }

  async updateBlacklistReason(
    userId: string,
    id: string,
    rawReason: string | null | undefined
  ): Promise<Company | null> {
    const company = await this.repository.findOne({ where: { id, userId } });
    if (!company?.blacklistedAt) {
      return null;
    }

    company.blacklistReason = normalizeText(rawReason);
    company.updatedAt = new Date();
    await this.repository.save(company);

    return toResponse(company);
  }

  /** Lifting the blacklist keeps the company: it may have been added by hand. */
  async unblacklist(userId: string, id: string): Promise<boolean> {
    const company = await this.repository.findOne({ where: { id, userId } });
    if (!company?.blacklistedAt) {
      return false;
    }
    company.blacklistedAt = null;
    company.blacklistReason = null;
    company.updatedAt = new Date();
    await this.repository.save(company);
    return true;
  }
}

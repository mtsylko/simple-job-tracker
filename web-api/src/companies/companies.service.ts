import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import {
  normalizeCompanyName,
  type Company,
  type CompanyBlacklist,
  type CompanySummary
} from '@job-tracker/shared';
import { JobEntity } from '../jobs/job.entity';
import { CompanyEntity } from './company.entity';
import { apiError } from '../common/errors/api-error';

/** Empty or whitespace-only reasons collapse to null rather than a blank note. */
function normalizeReason(raw: string | null | undefined): string | null {
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
    company.blacklistReason = normalizeReason(rawReason);
    company.updatedAt = now;
    await this.repository.save(company);

    return toResponse(company);
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

    company.blacklistReason = normalizeReason(rawReason);
    company.updatedAt = new Date();
    await this.repository.save(company);

    return toResponse(company);
  }

  /** Nothing else is stored on a company yet, so lifting the blacklist drops the row. */
  async unblacklist(userId: string, id: string): Promise<boolean> {
    const company = await this.repository.findOne({ where: { id, userId } });
    if (!company?.blacklistedAt) {
      return false;
    }
    await this.repository.delete({ id, userId });
    return true;
  }
}

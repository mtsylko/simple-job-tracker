import {
  BadRequestException,
  ConflictException,
  Injectable
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import {
  BUILT_IN_JOB_STATUSES,
  type CreateJobStatusOptionInput,
  type JobStatusOption,
  type UpdateJobStatusOptionInput
} from '@job-tracker/shared';
import { JobEntity } from '../jobs/job.entity';
import { JobStatusOptionEntity } from './job-status-option.entity';
import { apiError } from '../common/errors/api-error';

@Injectable()
export class JobStatusesService {
  constructor(
    @InjectRepository(JobStatusOptionEntity)
    private readonly repository: Repository<JobStatusOptionEntity>,
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>
  ) {}

  /**
   * Seeds the built-in statuses for one user. Called once when the account is
   * created (the initial migration covers users that predate it), so reads stay
   * pure and never write. Idempotent and race-safe: the insert is ON CONFLICT DO
   * NOTHING against the unique (user_id, value), so a repeated or concurrent call
   * adds nothing rather than colliding, and it never resurrects a deleted status.
   */
  async seedDefaults(userId: string): Promise<void> {
    const now = new Date();
    await this.repository
      .createQueryBuilder()
      .insert()
      .values(
        BUILT_IN_JOB_STATUSES.map((status, index) => ({
          id: randomUUID(),
          userId,
          value: status.value,
          color: status.color,
          showAsTab: status.showAsTab,
          sortOrder: index,
          isDefault: index === 0,
          archivedAt: null,
          createdAt: now,
          updatedAt: now
        }))
      )
      .orIgnore()
      .execute();
  }

  /**
   * Resolves the option a job should link to for `rawValue`. Find-only, across
   * active and archived: a status must already exist (the form offers the list),
   * so a stray value is a client error, not a reason to create a status.
   */
  async resolveOption(
    userId: string,
    rawValue: string
  ): Promise<JobStatusOptionEntity> {
    const value = rawValue.trim();
    const existing = value
      ? await this.repository.findOne({ where: { userId, value } })
      : null;
    if (!existing) {
      throw new BadRequestException(
        apiError('JOB_STATUS_UNKNOWN', 'Unknown status')
      );
    }
    return existing;
  }

  /** The status a new job gets when the caller doesn't specify one. */
  async getDefaultOption(userId: string): Promise<JobStatusOptionEntity> {
    const preferred = await this.repository.findOne({
      where: { userId, isDefault: true, archivedAt: IsNull() },
      order: { sortOrder: 'ASC', createdAt: 'ASC' }
    });
    if (preferred) {
      return preferred;
    }

    const first = await this.repository.findOne({
      where: { userId, archivedAt: IsNull() },
      order: { sortOrder: 'ASC', createdAt: 'ASC' }
    });
    if (!first) {
      throw new BadRequestException(
        apiError('JOB_STATUS_NONE_CONFIGURED', 'No status is configured')
      );
    }
    return first;
  }

  async listOptions(userId: string): Promise<JobStatusOption[]> {
    const options = await this.repository.find({
      where: { userId, archivedAt: IsNull() },
      order: { sortOrder: 'ASC', createdAt: 'ASC' }
    });

    if (options.length > 0 && !options.some((option) => option.isDefault)) {
      // Derived for the response only: a GET must not write, see JwtAuthGuard.
      options[0].isDefault = true;
    }

    const usageRows = await this.jobRepository
      .createQueryBuilder('job')
      .select('job.statusOptionId', 'id')
      .addSelect('COUNT(*)', 'count')
      .where('job.userId = :userId', { userId })
      .andWhere('job.statusOptionId IS NOT NULL')
      .groupBy('job.statusOptionId')
      .getRawMany<{ id: string; count: string }>();

    const usageById = new Map(
      usageRows.map((row) => [row.id, Number(row.count)])
    );

    return options.map((option) => this.toDto(option, usageById));
  }

  async create(
    userId: string,
    input: CreateJobStatusOptionInput
  ): Promise<JobStatusOption> {
    const value = input.value.trim();

    // The unique (user_id, value) covers archived rows too, so a name that
    // matches one still in use (archived, not deleted) must reactivate that row
    // rather than collide — same "reuse revives" model as role/level/type.
    const existing = await this.repository.findOne({
      where: { userId, value }
    });
    if (existing && !existing.archivedAt) {
      throw new ConflictException(
        apiError('JOB_STATUS_TAKEN', 'This status already exists')
      );
    }

    const maxSortOrder = await this.repository
      .createQueryBuilder('option')
      .select('MAX(option.sortOrder)', 'max')
      .where('option.userId = :userId', { userId })
      .getRawOne<{ max: number | null }>();
    const nextSort = (maxSortOrder?.max ?? -1) + 1;

    const now = new Date();
    const row =
      existing ??
      this.repository.create({
        id: randomUUID(),
        userId,
        value,
        isDefault:
          maxSortOrder?.max === null || maxSortOrder?.max === undefined,
        createdAt: now
      });
    row.color = input.color;
    row.showAsTab = input.showAsTab ?? false;
    row.sortOrder = nextSort;
    row.archivedAt = null;
    row.updatedAt = now;
    await this.repository.save(row);

    const options = await this.listOptions(userId);
    return options.find((candidate) => candidate.value === value)!;
  }

  async updateOption(
    userId: string,
    id: string,
    input: UpdateJobStatusOptionInput
  ): Promise<JobStatusOption | null> {
    const option = await this.repository.findOne({ where: { id, userId } });
    if (!option) {
      return null;
    }

    if (input.value !== undefined) {
      const value = input.value.trim();
      const duplicate = await this.repository.findOne({
        where: { userId, value }
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          apiError('JOB_STATUS_TAKEN', 'This status already exists')
        );
      }
      option.value = value;
    }
    if (input.color !== undefined) {
      option.color = input.color;
    }
    if (input.showAsTab !== undefined) {
      option.showAsTab = input.showAsTab;
    }

    option.updatedAt = new Date();
    await this.repository.save(option);

    const options = await this.listOptions(userId);
    return options.find((candidate) => candidate.id === id) ?? null;
  }

  async deleteOption(userId: string, id: string): Promise<boolean> {
    const target = await this.repository.findOne({ where: { id, userId } });
    if (!target) {
      return false;
    }

    // An option a job still references cannot be hard-deleted (FK RESTRICT), so
    // it is archived — kept for label resolution but dropped from the active list.
    // An unused option is removed outright.
    const usage = await this.jobRepository.count({
      where: { userId, statusOptionId: id }
    });
    const wasDefault = target.isDefault;

    if (usage > 0) {
      const now = new Date();
      target.archivedAt = now;
      target.updatedAt = now;
      target.isDefault = false;
      await this.repository.save(target);
    } else {
      await this.repository.delete({ id, userId });
    }

    if (wasDefault) {
      const next = await this.repository.findOne({
        where: { userId, archivedAt: IsNull() },
        order: { sortOrder: 'ASC', createdAt: 'ASC' }
      });
      if (next) {
        next.isDefault = true;
        await this.repository.save(next);
      }
    }

    return true;
  }

  async setDefault(userId: string, id: string): Promise<boolean> {
    const target = await this.repository.findOne({ where: { id, userId } });
    if (!target) {
      return false;
    }

    await this.repository.update({ userId }, { isDefault: false });
    target.isDefault = true;
    await this.repository.save(target);
    return true;
  }

  async reorder(userId: string, orderedIds: string[]): Promise<void> {
    const options = await this.repository.find({
      where: { userId, archivedAt: IsNull() }
    });
    const byId = new Map(options.map((option) => [option.id, option]));

    if (
      orderedIds.length !== options.length ||
      !orderedIds.every((id) => byId.has(id))
    ) {
      throw new BadRequestException(
        apiError(
          'LIST_ORDER_MISMATCH',
          'orderedIds must match the existing option ids'
        )
      );
    }

    const reordered = orderedIds.map((id) => byId.get(id)!);
    await Promise.all(
      reordered.map((option, index) => {
        option.sortOrder = index;
        return this.repository.save(option);
      })
    );
  }

  private toDto(
    option: JobStatusOptionEntity,
    usageById: Map<string, number>
  ): JobStatusOption {
    return {
      id: option.id,
      value: option.value,
      color: option.color,
      showAsTab: option.showAsTab,
      sortOrder: option.sortOrder,
      isDefault: option.isDefault,
      usageCount: usageById.get(option.id) ?? 0
    };
  }
}

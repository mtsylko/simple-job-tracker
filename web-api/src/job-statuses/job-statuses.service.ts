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
import { apiError } from '../common/errors/api-error';
import { JobEntity } from '../jobs/job.entity';
import { TaxonomyService } from '../taxonomies/taxonomy.service';
import { JobStatusOptionEntity } from './job-status-option.entity';

@Injectable()
export class JobStatusesService extends TaxonomyService<
  JobStatusOptionEntity,
  JobStatusOption
> {
  constructor(
    @InjectRepository(JobStatusOptionEntity)
    repository: Repository<JobStatusOptionEntity>,
    @InjectRepository(JobEntity)
    jobRepository: Repository<JobEntity>
  ) {
    super(
      repository,
      jobRepository,
      'statusOptionId',
      BUILT_IN_JOB_STATUSES.map(({ value, color, showAsTab }) => ({
        value,
        color,
        showAsTab
      }))
    );
  }

  /** Find-only, archived included: the form offers the list, so an unknown label is a client error. */
  override async resolveOption(
    userId: string,
    rawValue: string
  ): Promise<JobStatusOptionEntity> {
    const value = rawValue.trim();
    const existing = value
      ? await this.findByValue(this.repository, userId, value)
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

  async create(
    userId: string,
    input: CreateJobStatusOptionInput
  ): Promise<JobStatusOption> {
    const value = input.value.trim();

    const id = await this.locked(userId, async (repository) => {
      // The unique covers archived rows too, so a name still in use is revived, not duplicated.
      const existing = await this.findByValue(repository, userId, value);
      if (existing && !existing.archivedAt) {
        throw this.valueTaken();
      }

      const place = await this.nextPlace(repository, userId);
      const now = new Date();
      const row =
        existing ??
        repository.create({
          id: randomUUID(),
          userId,
          value,
          isDefault: place.isDefault,
          createdAt: now
        });
      row.color = input.color;
      row.showAsTab = input.showAsTab ?? false;
      row.sortOrder = place.sortOrder;
      row.archivedAt = null;
      row.updatedAt = now;
      await this.saveUnique(repository, row);
      return row.id;
    });

    return (await this.findOption(userId, id))!;
  }

  async updateOption(
    userId: string,
    id: string,
    input: UpdateJobStatusOptionInput
  ): Promise<JobStatusOption | null> {
    const found = await this.locked(userId, async (repository) => {
      const option = await repository.findOne({ where: { id, userId } });
      if (!option) {
        return false;
      }

      if (input.value !== undefined) {
        const value = input.value.trim();
        await this.assertValueFree(repository, userId, id, value);
        option.value = value;
      }
      if (input.color !== undefined) {
        option.color = input.color;
      }
      if (input.showAsTab !== undefined) {
        option.showAsTab = input.showAsTab;
      }

      option.updatedAt = new Date();
      await this.saveUnique(repository, option);
      return true;
    });

    return found ? this.findOption(userId, id) : null;
  }

  protected override valueTaken(): ConflictException {
    return new ConflictException(
      apiError('JOB_STATUS_TAKEN', 'This status already exists')
    );
  }

  protected override toOption(
    option: JobStatusOptionEntity,
    usageCount: number
  ): JobStatusOption {
    return {
      id: option.id,
      value: option.value,
      color: option.color,
      showAsTab: option.showAsTab,
      sortOrder: option.sortOrder,
      isDefault: option.isDefault,
      usageCount
    };
  }
}

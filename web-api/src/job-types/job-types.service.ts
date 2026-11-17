import {
  BadRequestException,
  ConflictException,
  Injectable
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import type { JobTaxonomyOption } from '@job-tracker/shared';
import { JobEntity } from '../jobs/job.entity';
import { JobTypeOptionEntity } from './job-type-option.entity';
import { apiError } from '../common/errors/api-error';

@Injectable()
export class JobTypesService {
  constructor(
    @InjectRepository(JobTypeOptionEntity)
    private readonly repository: Repository<JobTypeOptionEntity>,
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>
  ) {}

  /**
   * Finds the option for this value or creates it, returning the row so callers
   * can link a job to it by id. Reusing a value revives an archived option — if
   * it is in use again it belongs back in the active list.
   */
  async resolveOption(
    userId: string,
    rawValue: string
  ): Promise<JobTypeOptionEntity | null> {
    const value = rawValue.trim();
    if (!value) {
      return null;
    }

    const now = new Date();
    const existing = await this.repository.findOne({
      where: { userId, value }
    });
    if (existing) {
      existing.updatedAt = now;
      if (existing.archivedAt) {
        existing.archivedAt = null;
      }
      return this.repository.save(existing);
    }

    const maxSortOrder = await this.repository
      .createQueryBuilder('option')
      .select('MAX(option.sortOrder)', 'max')
      .where('option.userId = :userId', { userId })
      .getRawOne<{ max: number | null }>();

    return this.repository.save(
      this.repository.create({
        id: randomUUID(),
        userId,
        value,
        sortOrder: (maxSortOrder?.max ?? -1) + 1,
        isDefault:
          maxSortOrder?.max === null || maxSortOrder?.max === undefined,
        archivedAt: null,
        createdAt: now,
        updatedAt: now
      })
    );
  }

  async saveValue(userId: string, rawValue: string): Promise<void> {
    await this.resolveOption(userId, rawValue);
  }

  async listValues(userId: string): Promise<string[]> {
    const options = await this.repository.find({
      select: ['value'],
      where: { userId, archivedAt: IsNull() },
      order: { sortOrder: 'ASC', createdAt: 'ASC' }
    });

    return options
      .map((option) => option.value.trim())
      .filter((value) => value.length > 0);
  }

  async listOptions(userId: string): Promise<JobTaxonomyOption[]> {
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
      .select('job.typeOptionId', 'id')
      .addSelect('COUNT(*)', 'count')
      .where('job.userId = :userId', { userId })
      .andWhere('job.typeOptionId IS NOT NULL')
      .groupBy('job.typeOptionId')
      .getRawMany<{ id: string; count: string }>();

    const usageById = new Map(
      usageRows.map((row) => [row.id, Number(row.count)])
    );

    return options.map((option) => ({
      id: option.id,
      value: option.value,
      sortOrder: option.sortOrder,
      isDefault: option.isDefault,
      usageCount: usageById.get(option.id) ?? 0
    }));
  }

  async updateValue(
    userId: string,
    id: string,
    rawValue: string
  ): Promise<JobTaxonomyOption | null> {
    const option = await this.repository.findOne({ where: { id, userId } });
    if (!option) {
      return null;
    }

    const value = rawValue.trim();
    const duplicate = await this.repository.findOne({
      where: { userId, value }
    });
    if (duplicate && duplicate.id !== id) {
      throw new ConflictException(
        apiError('TAXONOMY_VALUE_TAKEN', 'This value already exists')
      );
    }

    option.value = value;
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
      where: { userId, typeOptionId: id }
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
    await this.persistOrder(reordered);
  }

  private async persistOrder(options: JobTypeOptionEntity[]): Promise<void> {
    await Promise.all(
      options.map((option, index) => {
        option.sortOrder = index;
        return this.repository.save(option);
      })
    );
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import type {
  CreateJobFieldInput,
  JobFieldDefinition,
  UpdateJobFieldInput
} from '@job-tracker/shared';
import { jobFieldTypeHasOptions } from '@job-tracker/shared';
import { JobEntity } from '../jobs/job.entity';
import { JobFieldDefinitionEntity } from './job-field-definition.entity';
import { apiError } from '../common/errors/api-error';

@Injectable()
export class JobFieldsService {
  constructor(
    @InjectRepository(JobFieldDefinitionEntity)
    private readonly repository: Repository<JobFieldDefinitionEntity>,
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>
  ) {}

  private mapEntity(entity: JobFieldDefinitionEntity): JobFieldDefinition {
    return {
      id: entity.id,
      key: entity.key,
      label: entity.label,
      type: entity.type,
      options: entity.options,
      required: entity.required,
      sortOrder: entity.sortOrder,
      archivedAt: entity.archivedAt ? entity.archivedAt.toISOString() : null
    };
  }

  /** Slugifies a label into a jsonb key. Falls back to `field` for label with no usable characters. */
  private toKey(label: string): string {
    const slug = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    return slug.length > 0 ? slug : 'field';
  }

  /** Keys are unique per user across archived rows too, so a new field never inherits retired data. */
  private async uniqueKey(userId: string, base: string): Promise<string> {
    const taken = new Set(
      (await this.repository.find({ select: ['key'], where: { userId } })).map(
        (row) => row.key
      )
    );

    if (!taken.has(base)) {
      return base;
    }

    let suffix = 2;
    while (taken.has(`${base}_${suffix}`)) {
      suffix += 1;
    }

    return `${base}_${suffix}`;
  }

  private normalizeOptions(
    type: JobFieldDefinition['type'],
    options: string[] | null | undefined
  ): string[] | null {
    if (!jobFieldTypeHasOptions(type)) {
      return null;
    }

    const normalized = Array.from(
      new Set((options ?? []).map((option) => option.trim()).filter(Boolean))
    );

    if (normalized.length === 0) {
      throw new BadRequestException(
        apiError(
          'JOB_FIELD_OPTIONS_REQUIRED',
          'At least one option is required'
        )
      );
    }

    return normalized;
  }

  async listDefinitions(
    userId: string,
    { includeArchived = false } = {}
  ): Promise<JobFieldDefinition[]> {
    const rows = await this.repository.find({
      where: includeArchived ? { userId } : { userId, archivedAt: IsNull() },
      order: { sortOrder: 'ASC', createdAt: 'ASC' }
    });

    return rows.map((row) => this.mapEntity(row));
  }

  async create(
    userId: string,
    input: CreateJobFieldInput
  ): Promise<JobFieldDefinition> {
    const label = input.label.trim();
    const options = this.normalizeOptions(input.type, input.options);

    const duplicate = await this.repository.findOne({
      where: { userId, label, archivedAt: IsNull() }
    });
    if (duplicate) {
      throw new ConflictException(
        apiError(
          'JOB_FIELD_NAME_TAKEN',
          'A field with this name already exists'
        )
      );
    }

    const maxSortOrder = await this.repository
      .createQueryBuilder('definition')
      .select('MAX(definition.sortOrder)', 'max')
      .where('definition.userId = :userId', { userId })
      .getRawOne<{ max: number | null }>();

    const now = new Date();
    const saved = await this.repository.save(
      this.repository.create({
        id: randomUUID(),
        userId,
        key: await this.uniqueKey(userId, this.toKey(label)),
        label,
        type: input.type,
        options,
        required: input.required ?? false,
        sortOrder: (maxSortOrder?.max ?? -1) + 1,
        archivedAt: null,
        createdAt: now,
        updatedAt: now
      })
    );

    return this.mapEntity(saved);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateJobFieldInput
  ): Promise<JobFieldDefinition | null> {
    const row = await this.repository.findOne({ where: { id, userId } });
    if (!row) {
      return null;
    }

    if (input.label !== undefined) {
      const label = input.label.trim();
      const duplicate = await this.repository.findOne({
        where: { userId, label, archivedAt: IsNull() }
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          apiError(
            'JOB_FIELD_NAME_TAKEN',
            'A field with this name already exists'
          )
        );
      }
      row.label = label;
    }

    if (input.options !== undefined) {
      const options = this.normalizeOptions(row.type, input.options);
      await this.assertRemovedOptionsUnused(userId, row, options ?? []);
      row.options = options;
    }

    if (input.required !== undefined) {
      row.required = input.required;
    }

    row.updatedAt = new Date();
    const saved = await this.repository.save(row);
    return this.mapEntity(saved);
  }

  /**
   * Dropping an option that jobs still hold would leave those rows unable to pass
   * validation on their next save, so it is refused the same way an in-use
   * taxonomy value would be.
   */
  private async assertRemovedOptionsUnused(
    userId: string,
    row: JobFieldDefinitionEntity,
    nextOptions: string[]
  ): Promise<void> {
    const removed = (row.options ?? []).filter(
      (option) => !nextOptions.includes(option)
    );
    if (removed.length === 0) {
      return;
    }

    const inUse = await this.findUsedOptionValues(userId, row);
    const blocked = removed.filter((option) => inUse.has(option));

    if (blocked.length > 0) {
      const options = blocked.join(', ');
      throw new ConflictException(
        apiError(
          'JOB_FIELD_OPTIONS_IN_USE',
          `These options are still used by existing applications: ${options}`,
          { options }
        )
      );
    }
  }

  private async findUsedOptionValues(
    userId: string,
    row: JobFieldDefinitionEntity
  ): Promise<Set<string>> {
    const rows =
      row.type === 'multiselect'
        ? await this.jobRepository.query<{ value: string }[]>(
            `SELECT DISTINCT element AS value
             FROM jobs, LATERAL jsonb_array_elements_text(custom_fields -> $2) AS element
             WHERE user_id = $1 AND jsonb_typeof(custom_fields -> $2) = 'array'`,
            [userId, row.key]
          )
        : await this.jobRepository.query<{ value: string | null }[]>(
            `SELECT DISTINCT custom_fields ->> $2 AS value
             FROM jobs
             WHERE user_id = $1 AND custom_fields -> $2 IS NOT NULL`,
            [userId, row.key]
          );

    return new Set(
      rows
        .map((item) => item.value)
        .filter((value): value is string => typeof value === 'string')
    );
  }

  /** Soft delete — stored values survive so historical applications stay intact. */
  async archive(userId: string, id: string): Promise<boolean> {
    const row = await this.repository.findOne({ where: { id, userId } });
    if (!row || row.archivedAt) {
      return false;
    }

    row.archivedAt = new Date();
    row.updatedAt = new Date();
    await this.repository.save(row);
    return true;
  }

  async reorder(userId: string, orderedIds: string[]): Promise<void> {
    const rows = await this.repository.find({
      where: { userId, archivedAt: IsNull() }
    });
    const byId = new Map(rows.map((row) => [row.id, row]));

    if (
      orderedIds.length !== rows.length ||
      !orderedIds.every((id) => byId.has(id))
    ) {
      throw new BadRequestException(
        apiError(
          'LIST_ORDER_MISMATCH',
          'orderedIds must match the existing field ids'
        )
      );
    }

    await Promise.all(
      orderedIds.map((id, index) => {
        const row = byId.get(id)!;
        row.sortOrder = index;
        return this.repository.save(row);
      })
    );
  }
}

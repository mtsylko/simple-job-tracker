import { BadRequestException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  IsNull,
  QueryFailedError,
  type EntityManager,
  type FindOptionsOrder,
  type FindOptionsWhere,
  type Repository
} from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import type { JobTaxonomyOption } from '@job-tracker/shared';
import { apiError } from '../common/errors/api-error';
import { JobEntity } from '../jobs/job.entity';
import type { TaxonomyOptionEntity } from './taxonomy-option.entity';

const UNIQUE_VIOLATION = '23505';

/** The `JobEntity` column that links a job to an option of the taxonomy. */
export type TaxonomyJobColumn =
  | 'roleOptionId'
  | 'levelOptionId'
  | 'typeOptionId'
  | 'employmentTypeOptionId'
  | 'contractTypeOptionId'
  | 'statusOptionId'
  | 'outcomeOptionId';

/** A built-in option a new account starts with: its label and the taxonomy's own columns. */
export type TaxonomySeed<T extends TaxonomyOptionEntity> = Pick<T, 'value'> &
  Partial<Omit<T, keyof TaxonomyOptionEntity>>;

/** One user's option list for a job field, kept in the table of `T` and linked from jobs by `jobColumn`. */
export abstract class TaxonomyService<
  T extends TaxonomyOptionEntity,
  O extends JobTaxonomyOption = JobTaxonomyOption
> {
  protected constructor(
    protected readonly repository: Repository<T>,
    private readonly jobRepository: Repository<JobEntity>,
    private readonly jobColumn: TaxonomyJobColumn,
    private readonly seeds: readonly TaxonomySeed<T>[] = []
  ) {}

  /** Seeds the built-in options once, when the account is created; ON CONFLICT keeps a repeat from adding anything. */
  async seedDefaults(userId: string): Promise<void> {
    if (this.seeds.length === 0) {
      return;
    }

    const now = new Date();
    await this.repository
      .createQueryBuilder()
      .insert()
      .values(
        this.seeds.map(
          (seed, index) =>
            ({
              id: randomUUID(),
              userId,
              sortOrder: index,
              isDefault: index === 0,
              archivedAt: null,
              createdAt: now,
              updatedAt: now,
              ...seed
            }) as QueryDeepPartialEntity<T>
        )
      )
      .orIgnore()
      .execute();
  }

  /** The option a job links to for this label, created when new; an archived one comes back. */
  async resolveOption(userId: string, rawValue: string): Promise<T | null> {
    const value = rawValue.trim();
    if (!value) {
      return null;
    }

    const existing = await this.findByValue(this.repository, userId, value);
    if (existing) {
      return existing.archivedAt ? this.revive(existing) : existing;
    }

    const place = await this.nextPlace(this.repository, userId);
    const now = new Date();
    // Two saves bringing the same new label at once both end up on one row.
    await this.repository
      .createQueryBuilder()
      .insert()
      .values(
        this.columns({
          id: randomUUID(),
          userId,
          value,
          ...place,
          archivedAt: null,
          createdAt: now,
          updatedAt: now
        })
      )
      .orIgnore()
      .execute();

    return this.findByValue(this.repository, userId, value);
  }

  async saveValue(userId: string, rawValue: string): Promise<void> {
    await this.resolveOption(userId, rawValue);
  }

  async listValues(userId: string): Promise<string[]> {
    const options = await this.repository.find({
      where: this.where({ userId, archivedAt: IsNull() }),
      order: this.listOrder()
    });

    return options
      .map((option) => option.value.trim())
      .filter((value) => value.length > 0);
  }

  async listOptions(userId: string): Promise<O[]> {
    const options = await this.repository.find({
      where: this.where({ userId, archivedAt: IsNull() }),
      order: this.listOrder()
    });

    if (options.length > 0 && !options.some((option) => option.isDefault)) {
      // Derived for the response only: a GET must not write, see JwtAuthGuard.
      options[0].isDefault = true;
    }

    const usage = await this.usageById(userId);
    return options.map((option) =>
      this.toOption(option, usage.get(option.id) ?? 0)
    );
  }

  async updateValue(
    userId: string,
    id: string,
    rawValue: string
  ): Promise<O | null> {
    const found = await this.locked(userId, async (repository) => {
      const option = await repository.findOne({
        where: this.where({ id, userId })
      });
      if (!option) {
        return false;
      }

      const value = rawValue.trim();
      await this.assertValueFree(repository, userId, id, value);
      option.value = value;
      option.updatedAt = new Date();
      await this.saveUnique(repository, option);
      return true;
    });

    return found ? this.findOption(userId, id) : null;
  }

  /** Archives an option a job still uses, since the FK is RESTRICT, and deletes an unused one. */
  deleteOption(userId: string, id: string): Promise<boolean> {
    return this.locked(userId, async (repository, manager) => {
      // FOR UPDATE: a job saved meanwhile waits on its FK check, so the count sees it.
      const target = await repository.findOne({
        where: this.where({ id, userId }),
        lock: { mode: 'pessimistic_write' }
      });
      if (!target) {
        return false;
      }

      const usage = await manager.getRepository(JobEntity).count({
        where: { userId, [this.jobColumn]: id } as FindOptionsWhere<JobEntity>
      });
      const wasDefault = target.isDefault;

      if (usage > 0) {
        const now = new Date();
        target.archivedAt = now;
        target.updatedAt = now;
        target.isDefault = false;
        await repository.save(target);
      } else {
        await repository.delete(this.where({ id, userId }));
      }

      if (wasDefault) {
        const next = await repository.findOne({
          where: this.where({ userId, archivedAt: IsNull() }),
          order: this.listOrder()
        });
        if (next) {
          next.isDefault = true;
          await repository.save(next);
        }
      }

      return true;
    });
  }

  setDefault(userId: string, id: string): Promise<boolean> {
    return this.locked(userId, async (repository) => {
      const target = await repository.findOne({
        where: this.where({ id, userId })
      });
      if (!target) {
        return false;
      }

      await repository.update(
        this.where({ userId }),
        this.columns({ isDefault: false })
      );
      await repository.update(
        this.where({ id, userId }),
        this.columns({ isDefault: true })
      );
      return true;
    });
  }

  async reorder(userId: string, orderedIds: string[]): Promise<void> {
    await this.locked(userId, async (repository) => {
      const options = await repository.find({
        where: this.where({ userId, archivedAt: IsNull() })
      });
      const known = new Set(options.map((option) => option.id));

      if (
        orderedIds.length !== options.length ||
        new Set(orderedIds).size !== orderedIds.length ||
        !orderedIds.every((id) => known.has(id))
      ) {
        throw new BadRequestException(
          apiError(
            'LIST_ORDER_MISMATCH',
            'orderedIds must match the existing option ids'
          )
        );
      }

      for (const [index, id] of orderedIds.entries()) {
        await repository.update(
          this.where({ id, userId }),
          this.columns({ sortOrder: index })
        );
      }
    });
  }

  /** The response shape of one option; a taxonomy with columns of its own adds them. */
  protected toOption(option: T, usageCount: number): O {
    return {
      id: option.id,
      value: option.value,
      sortOrder: option.sortOrder,
      isDefault: option.isDefault,
      usageCount
    } as O;
  }

  protected valueTaken(): ConflictException {
    return new ConflictException(
      apiError('TAXONOMY_VALUE_TAKEN', 'This value already exists')
    );
  }

  /** Runs a multi-step write in one transaction, one at a time for this user's list. */
  protected locked<R>(
    userId: string,
    work: (repository: Repository<T>, manager: EntityManager) => Promise<R>
  ): Promise<R> {
    return this.repository.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `${this.repository.metadata.tableName}:${userId}`
      ]);
      return work(manager.getRepository(this.repository.target), manager);
    });
  }

  /** Where a new option goes: after every other, and the default when it is the first. */
  protected async nextPlace(
    repository: Repository<T>,
    userId: string
  ): Promise<{ sortOrder: number; isDefault: boolean }> {
    const last = await repository
      .createQueryBuilder('option')
      .select('MAX(option.sortOrder)', 'max')
      .where('option.userId = :userId', { userId })
      .getRawOne<{ max: number | null }>();
    const max = last?.max ?? null;

    return { sortOrder: (max ?? -1) + 1, isDefault: max === null };
  }

  protected async assertValueFree(
    repository: Repository<T>,
    userId: string,
    id: string,
    value: string
  ): Promise<void> {
    const duplicate = await this.findByValue(repository, userId, value);
    if (duplicate && duplicate.id !== id) {
      throw this.valueTaken();
    }
  }

  /** Saves, reporting a label another request took first as taken rather than as a 500. */
  protected async saveUnique(repository: Repository<T>, option: T): Promise<T> {
    try {
      return await repository.save(option);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { code?: string }).code ===
          UNIQUE_VIOLATION
      ) {
        throw this.valueTaken();
      }
      throw error;
    }
  }

  protected async findOption(userId: string, id: string): Promise<O | null> {
    const options = await this.listOptions(userId);
    return options.find((option) => option.id === id) ?? null;
  }

  protected findByValue(
    repository: Repository<T>,
    userId: string,
    value: string
  ): Promise<T | null> {
    return repository.findOne({ where: this.where({ userId, value }) });
  }

  protected where(
    filter: FindOptionsWhere<TaxonomyOptionEntity>
  ): FindOptionsWhere<T> {
    return filter as FindOptionsWhere<T>;
  }

  /** Values of the shared columns, typed for a write to the table of `T`. */
  private columns(
    values: QueryDeepPartialEntity<TaxonomyOptionEntity>
  ): QueryDeepPartialEntity<T> {
    return values as unknown as QueryDeepPartialEntity<T>;
  }

  private listOrder(): FindOptionsOrder<T> {
    return { sortOrder: 'ASC', createdAt: 'ASC' } as FindOptionsOrder<T>;
  }

  private revive(option: T): Promise<T> {
    option.archivedAt = null;
    option.updatedAt = new Date();
    return this.repository.save(option);
  }

  private async usageById(userId: string): Promise<Map<string, number>> {
    const column = `job.${this.jobColumn}`;
    const rows = await this.jobRepository
      .createQueryBuilder('job')
      .select(column, 'id')
      .addSelect('COUNT(*)', 'count')
      .where('job.userId = :userId', { userId })
      .andWhere(`${column} IS NOT NULL`)
      .groupBy(column)
      .getRawMany<{ id: string; count: string }>();

    return new Map(rows.map((row) => [row.id, Number(row.count)]));
  }
}

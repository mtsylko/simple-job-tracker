import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Type,
  mixin
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ApiErrorBody } from '@job-tracker/shared';
import { UserEntity } from '../../auth/user.entity';

/**
 * Counter/date column pairs, kept as a union so a quota can never be built from
 * one quota's count and another's date.
 */
type QuotaFields = { count: 'aiCallCount'; date: 'aiCallDate' };

type DailyQuotaConfig = {
  fields: QuotaFields;
  limit: number;
  /** Sent as the 429 body; the frontend prefers its own translated copy. */
  body: ApiErrorBody;
};

export function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Caps non-admin users at `limit` requests per UTC day, answering 429 beyond
 * that. The counter resets lazily: a stored date older than today is read as
 * zero, so no scheduled job is needed.
 *
 * Must run after JwtAuthGuard, which populates `request.user`. The owning
 * module needs `TypeOrmModule.forFeature([UserEntity])`.
 */
export function DailyQuotaGuard({
  fields,
  limit,
  body
}: DailyQuotaConfig): Type<CanActivate> {
  @Injectable()
  class DailyQuotaMixinGuard implements CanActivate {
    constructor(
      @InjectRepository(UserEntity)
      private userRepo: Repository<UserEntity>
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const { user } = context
        .switchToHttp()
        .getRequest<{ user?: UserEntity }>();
      if (!user) return false;
      if (user.role === 'admin') return true;

      const today = utcDay();
      const count = this.column(fields.count);
      const date = this.column(fields.date);

      // One conditional UPDATE, so parallel requests cannot all read the same count.
      const { affected } = await this.userRepo
        .createQueryBuilder()
        .update()
        .set({
          [fields.count]: () =>
            `CASE WHEN ${date} = :today THEN ${count} + 1 ELSE 1 END`,
          [fields.date]: today
        })
        .where('id = :id', { id: user.id })
        .andWhere(`(${date} IS DISTINCT FROM :today OR ${count} < :limit)`, {
          today,
          limit
        })
        .execute();

      if (!affected) {
        throw new HttpException(body, HttpStatus.TOO_MANY_REQUESTS);
      }
      return true;
    }

    private column(property: string): string {
      const column =
        this.userRepo.metadata.findColumnWithPropertyName(property);
      if (!column) throw new Error(`UserEntity has no column ${property}`);
      return `"${column.databaseName}"`;
    }
  }

  return mixin(DailyQuotaMixinGuard);
}

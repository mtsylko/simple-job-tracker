import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  AdminFeedback,
  CreateFeedbackInput,
  FeedbackKind
} from '@job-tracker/shared';
import { FeedbackEntity } from './feedback.entity';

const USER_AGENT_MAX_LENGTH = 512;

const FEEDBACK_DAILY_LIMIT = 10;

export type CreateFeedbackResult = 'created' | 'limit-reached';

type AdminFeedbackRow = {
  id: string;
  kind: FeedbackKind;
  message: string;
  page_path: string | null;
  user_agent: string | null;
  created_at: Date;
  resolved_at: Date | null;
  user_id: string;
  email: string;
  display_name: string | null;
};

const ADMIN_FEEDBACK_SQL = `
  SELECT
    f.id,
    f.kind,
    f.message,
    f.page_path,
    f.user_agent,
    f.created_at,
    f.resolved_at,
    u.id AS user_id,
    u.email,
    u.display_name
  FROM feedback f
  JOIN users u ON u.id = f.user_id
`;

function toAdminFeedback(row: AdminFeedbackRow): AdminFeedback {
  return {
    id: row.id,
    kind: row.kind,
    message: row.message,
    pagePath: row.page_path,
    userAgent: row.user_agent,
    createdAt: row.created_at.toISOString(),
    resolvedAt: row.resolved_at?.toISOString() ?? null,
    user: {
      id: row.user_id,
      email: row.email,
      displayName: row.display_name
    }
  };
}

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(FeedbackEntity)
    private readonly repo: Repository<FeedbackEntity>
  ) {}

  /** Counts the last 24 hours by the database clock, under a per-user lock so parallel sends cannot all pass the count. */
  create(
    userId: string,
    input: CreateFeedbackInput,
    userAgent: string | undefined
  ): Promise<CreateFeedbackResult> {
    return this.repo.manager.transaction(async (manager) => {
      await manager.query(
        `SELECT pg_advisory_xact_lock(hashtext('feedback:' || $1))`,
        [userId]
      );
      const [{ count }] = await manager.query<{ count: number }[]>(
        `SELECT count(*)::int AS count FROM feedback
         WHERE user_id = $1 AND created_at > now() - interval '24 hours'`,
        [userId]
      );
      if (count >= FEEDBACK_DAILY_LIMIT) return 'limit-reached';

      await manager.insert(FeedbackEntity, {
        userId,
        kind: input.kind,
        message: input.message,
        pagePath: input.pagePath,
        userAgent: userAgent?.slice(0, USER_AGENT_MAX_LENGTH) || null
      });
      return 'created';
    });
  }

  async listForAdmin(): Promise<AdminFeedback[]> {
    const rows = await this.repo.query<AdminFeedbackRow[]>(
      `${ADMIN_FEEDBACK_SQL} ORDER BY f.created_at DESC`
    );
    return rows.map(toAdminFeedback);
  }

  async setResolved(
    id: string,
    resolved: boolean
  ): Promise<AdminFeedback | null> {
    // Resolving an already resolved message keeps the time it was first closed.
    const result = await this.repo.update(id, {
      resolvedAt: resolved ? () => 'COALESCE(resolved_at, now())' : null
    });
    if (!result.affected) return null;

    const rows = await this.repo.query<AdminFeedbackRow[]>(
      `${ADMIN_FEEDBACK_SQL} WHERE f.id = $1`,
      [id]
    );
    return rows[0] ? toAdminFeedback(rows[0]) : null;
  }
}

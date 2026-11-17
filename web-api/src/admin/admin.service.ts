import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type {
  AdminUserSummary,
  AdminViewTarget,
  UserRole
} from '@job-tracker/shared';
import { UserEntity } from '../auth/user.entity';
import { utcDay } from '../common/guards/daily-quota.guard';
import { AdminViewSessionEntity } from './admin-view-session.entity';

type AdminUserRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  created_at: Date;
  ai_call_count: number;
  ai_call_date: string | null;
  application_count: number;
  cv_version_count: number;
  last_active_at: Date | null;
};

export type StartViewSessionResult =
  | { kind: 'started'; target: AdminViewTarget }
  | { kind: 'not-found' }
  | { kind: 'not-allowed' };

// Counts are grouped once per table rather than per user; GREATEST skips a NULL side.
const LIST_USERS_SQL = `
  SELECT
    u.id,
    u.email,
    u.display_name,
    u.role,
    u.created_at,
    u.ai_call_count,
    u.ai_call_date,
    COALESCE(j.count, 0) AS application_count,
    COALESCE(c.count, 0) AS cv_version_count,
    GREATEST(j.last_updated_at, c.last_updated_at) AS last_active_at
  FROM users u
  LEFT JOIN (
    SELECT user_id, COUNT(*)::int AS count, MAX(updated_at) AS last_updated_at
    FROM jobs
    GROUP BY user_id
  ) j ON j.user_id = u.id
  LEFT JOIN (
    SELECT user_id, COUNT(*)::int AS count, MAX(updated_at) AS last_updated_at
    FROM cv_versions
    GROUP BY user_id
  ) c ON c.user_id = u.id
  ORDER BY u.created_at DESC
`;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(AdminViewSessionEntity)
    private readonly viewSessionRepo: Repository<AdminViewSessionEntity>
  ) {}

  async listUsers(): Promise<AdminUserSummary[]> {
    const rows = await this.userRepo.query<AdminUserRow[]>(LIST_USERS_SQL);
    const today = utcDay();

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      createdAt: row.created_at.toISOString(),
      lastActiveAt: row.last_active_at?.toISOString() ?? null,
      applicationCount: row.application_count,
      cvVersionCount: row.cv_version_count,
      aiCallsToday: row.ai_call_date === today ? row.ai_call_count : 0
    }));
  }

  /** Logs the view; `JwtAuthGuard` honours the view-as header only while such a row is recent. */
  async startViewSession(
    adminId: string,
    userId: string
  ): Promise<StartViewSessionResult> {
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user) {
      return { kind: 'not-found' };
    }
    // Admins, the caller included, are never viewed.
    if (user.role !== 'user') {
      return { kind: 'not-allowed' };
    }

    await this.viewSessionRepo.insert({ adminId, userId });

    return {
      kind: 'started',
      target: { id: user.id, email: user.email, displayName: user.displayName }
    };
  }

  /** Closes every open view of this user by this admin, so the header stops working at once. */
  async endViewSessions(adminId: string, userId: string): Promise<void> {
    await this.viewSessionRepo.update(
      { adminId, userId, endedAt: IsNull() },
      { endedAt: new Date() }
    );
  }
}

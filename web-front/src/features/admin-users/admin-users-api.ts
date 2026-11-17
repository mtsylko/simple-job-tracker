import type { AdminUserSummary, AdminViewTarget } from '@job-tracker/shared';
import { request } from '@/lib/api-client';

const ENDPOINT = '/api/admin/users';

export function listAdminUsers(): Promise<AdminUserSummary[]> {
  return request<AdminUserSummary[]>(ENDPOINT);
}

export function startViewSession(userId: string): Promise<AdminViewTarget> {
  return request<AdminViewTarget>(
    `${ENDPOINT}/${encodeURIComponent(userId)}/view-sessions`,
    { method: 'POST' }
  );
}

export function endViewSession(userId: string): Promise<void> {
  return request<void>(
    `${ENDPOINT}/${encodeURIComponent(userId)}/view-sessions`,
    { method: 'DELETE' }
  );
}

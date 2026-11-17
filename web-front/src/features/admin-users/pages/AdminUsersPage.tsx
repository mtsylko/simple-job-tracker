import { useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AdminUserSummary } from '@job-tracker/shared';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@/components/ui/input-group';
import {
  AdminUsersTable,
  AdminUsersTableSkeleton
} from '@/features/admin-users/components/AdminUsersTable';
import type { AdminUsersState } from '@/features/admin-users/use-admin-users';
import {
  ACTIVE_WINDOW_DAYS,
  sortByActivity,
  summarizeActivity
} from '@/features/admin-users/user-activity';

export function AdminUsersPage({
  state,
  openingId,
  onOpen
}: {
  state: AdminUsersState;
  openingId: string | null;
  onOpen: (user: AdminUserSummary) => void;
}) {
  const { t } = useTranslation('adminUsers');
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();
  const visible = sortByActivity(
    state.users.filter(
      (user) =>
        !query ||
        user.email.toLowerCase().includes(query) ||
        (user.displayName?.toLowerCase().includes(query) ?? false)
    )
  );
  const summary = summarizeActivity(state.users);
  const ready = !state.isLoading && !state.error;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-1 px-4 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-7">
        <h1 className="m-0 font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">
          {t('page.title')}
        </h1>
        <p className="num min-h-5 text-sm text-muted-foreground">
          {ready &&
            t('page.summary', {
              active: summary.active,
              count: summary.total,
              days: ACTIVE_WINDOW_DAYS,
              ai: summary.aiCallsToday
            })}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-20 sm:px-7">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <InputGroup className="w-full sm:w-64">
              <InputGroupAddon align="inline-start">
                <Search className="size-3.5" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label={t('page.searchLabel')}
                placeholder={t('page.searchPlaceholder')}
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
              />
            </InputGroup>
            {ready && query && (
              <span
                className="num text-sm text-muted-foreground"
                aria-live="polite"
              >
                {t('page.matches', {
                  shown: visible.length,
                  count: state.users.length
                })}
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-warm-line bg-card">
            {state.error ? (
              <p className="px-5 py-4 text-sm text-destructive">
                {state.error}
              </p>
            ) : state.isLoading ? (
              <AdminUsersTableSkeleton />
            ) : (
              <AdminUsersTable
                users={visible}
                emptyMessage={t(query ? 'list.noMatch' : 'list.empty')}
                openingId={openingId}
                onOpen={onOpen}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

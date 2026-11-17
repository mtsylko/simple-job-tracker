import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AdminUserSummary } from '@job-tracker/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { describeRecency } from '@/features/admin-users/user-activity';
import { useDateLocale } from '@/lib/date-locale';
import { formatDisplayDate } from '@/lib/format-date';

const SKELETON_ROWS = 4;

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

function LastActiveCell({ value }: { value: string | null }) {
  const { t } = useTranslation('adminUsers');
  const locale = useDateLocale();
  const recency = describeRecency(value, locale);

  if (!value || !recency) {
    return <Dash />;
  }

  return (
    <div className="flex flex-col">
      <span className="text-sm text-foreground">
        {recency.kind === 'ago' ? recency.text : t(`list.${recency.kind}`)}
      </span>
      <span className="text-xs text-muted-foreground">
        {formatDisplayDate(value.slice(0, 10))}
      </span>
    </div>
  );
}

function ColumnHeads() {
  const { t } = useTranslation('adminUsers');

  return (
    <TableHeader className="bg-transparent">
      <TableRow className="border-warm-line hover:bg-transparent">
        <TableHead className="pl-5">{t('list.user')}</TableHead>
        <TableHead className="hidden w-36 sm:table-cell">
          {t('list.lastActive')}
        </TableHead>
        <TableHead className="hidden w-28 lg:table-cell">
          {t('list.joined')}
        </TableHead>
        <TableHead className="w-24 text-center sm:w-28">
          {t('list.applications')}
        </TableHead>
        <TableHead className="hidden w-16 text-center md:table-cell">
          {t('list.cvVersions')}
        </TableHead>
        <TableHead className="hidden w-24 text-center md:table-cell">
          {t('list.aiToday')}
        </TableHead>
        <TableHead className="w-14 pr-5 sm:w-24">
          <span className="sr-only">{t('list.actions')}</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}

/** The final layout with each value as a flat bar at its real size, so nothing shifts when the rows land. */
export function AdminUsersTableSkeleton() {
  return (
    <Table className="table-fixed" aria-busy="true">
      <ColumnHeads />
      <TableBody>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <TableRow
            key={index}
            className="border-warm-line hover:bg-transparent"
          >
            <TableCell className="pl-5">
              <Skeleton className="mb-1.5 h-3.5 w-36 animate-none" />
              <Skeleton className="h-3 w-48 animate-none" />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Skeleton className="mb-1.5 h-3.5 w-20 animate-none" />
              <Skeleton className="h-3 w-16 animate-none" />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <Skeleton className="h-3.5 w-20 animate-none" />
            </TableCell>
            <TableCell>
              <Skeleton className="mx-auto h-3.5 w-8 animate-none" />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Skeleton className="mx-auto h-3.5 w-5 animate-none" />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Skeleton className="mx-auto h-3.5 w-5 animate-none" />
            </TableCell>
            <TableCell className="pr-5" />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function AdminUsersTable({
  users,
  emptyMessage,
  openingId,
  onOpen
}: {
  users: AdminUserSummary[];
  emptyMessage: string;
  openingId: string | null;
  onOpen: (user: AdminUserSummary) => void;
}) {
  const { t } = useTranslation('adminUsers');

  if (users.length === 0) {
    return (
      <p className="px-5 py-4 text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    // Fixed layout: the user column, the one without a width, takes the rest.
    <Table className="table-fixed">
      <ColumnHeads />
      <TableBody>
        {users.map((user) => {
          const name = user.displayName ?? user.email;
          const actionLabel = t('viewAs.open', { name });
          // Admins are never viewed, so their rows carry no action at all.
          const canOpen = user.role === 'user';
          const busy = openingId !== null;

          return (
            // View-as switches accounts, so it stays on the name and the View button: the row does not open
            <TableRow
              key={user.id}
              className="border-warm-line hover:bg-transparent"
            >
              <TableCell className="py-2.5 pl-5">
                <div className="flex min-w-0 flex-col">
                  <div className="flex min-w-0 items-center gap-2">
                    {canOpen ? (
                      <button
                        type="button"
                        className="min-w-0 cursor-pointer truncate border-0 bg-transparent p-0 text-left text-sm font-medium text-foreground hover:underline disabled:cursor-not-allowed"
                        disabled={busy}
                        title={actionLabel}
                        onClick={() => onOpen(user)}
                      >
                        {name}
                      </button>
                    ) : (
                      <span className="truncate text-sm font-medium text-foreground">
                        {name}
                      </span>
                    )}
                    {user.role === 'admin' && (
                      <Badge className="flex-none text-xs normal-case tracking-normal">
                        {t('roles.admin')}
                      </Badge>
                    )}
                  </div>
                  {user.displayName && (
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="num hidden sm:table-cell">
                <LastActiveCell value={user.lastActiveAt} />
              </TableCell>
              <TableCell className="num hidden text-sm text-muted-foreground lg:table-cell">
                {formatDisplayDate(user.createdAt.slice(0, 10))}
              </TableCell>
              <TableCell className="num text-center text-sm text-foreground">
                {user.applicationCount.toLocaleString()}
              </TableCell>
              <TableCell className="num hidden text-center text-sm text-muted-foreground md:table-cell">
                {user.cvVersionCount.toLocaleString()}
              </TableCell>
              <TableCell className="num hidden text-center text-sm text-muted-foreground md:table-cell">
                {user.aiCallsToday.toLocaleString()}
              </TableCell>
              <TableCell className="py-1.5 pr-5">
                {canOpen && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      disabled={busy}
                      aria-label={actionLabel}
                      onClick={() => onOpen(user)}
                    >
                      <Eye aria-hidden="true" data-icon="inline-start" />
                      <span className="hidden sm:inline">
                        {openingId === user.id
                          ? t('viewAs.opening')
                          : t('viewAs.view')}
                      </span>
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

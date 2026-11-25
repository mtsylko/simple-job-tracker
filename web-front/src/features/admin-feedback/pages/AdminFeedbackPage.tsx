import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminFeedback } from '@job-tracker/shared';

import { PageTabs } from '@/components/PageTabs';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedbackItem } from '@/features/admin-feedback/components/FeedbackItem';
import type { AdminFeedbackState } from '@/features/admin-feedback/use-admin-feedback';

type FeedbackTab = 'open' | 'resolved';

const SKELETON_ITEMS = 3;

export function AdminFeedbackPage({
  state,
  pendingIds,
  onToggleResolved
}: {
  state: AdminFeedbackState;
  pendingIds: ReadonlySet<string>;
  onToggleResolved: (item: AdminFeedback) => void;
}) {
  const { t } = useTranslation('adminFeedback');
  const [tab, setTab] = useState<FeedbackTab>('open');

  const open = state.items.filter((item) => item.resolvedAt === null);
  const resolved = state.items.filter((item) => item.resolvedAt !== null);
  const visible = tab === 'open' ? open : resolved;
  const ready = !state.isLoading && !state.error;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-1 px-4 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-7">
        <h1 className="m-0 font-serif text-display font-light leading-tight tracking-tight text-foreground">
          {t('page.title')}
        </h1>
        <p className="num min-h-5 text-sm text-muted-foreground">
          {ready &&
            t('page.summary', { open: open.length, count: state.items.length })}
        </p>
      </div>

      <PageTabs
        tabs={[
          {
            key: 'open',
            label: t('tabs.open'),
            count: ready ? open.length : undefined
          },
          {
            key: 'resolved',
            label: t('tabs.resolved'),
            count: ready ? resolved.length : undefined
          }
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-20 sm:px-7">
        <div className="overflow-hidden rounded-xl border border-warm-line bg-card">
          {state.error ? (
            <p className="px-5 py-4 text-sm text-destructive">{state.error}</p>
          ) : state.isLoading ? (
            <ul aria-busy="true" className="divide-y divide-warm-line">
              {Array.from({ length: SKELETON_ITEMS }, (_, index) => (
                <li key={index} className="flex flex-col gap-2.5 px-5 py-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </li>
              ))}
            </ul>
          ) : visible.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              {t(tab === 'open' ? 'list.emptyOpen' : 'list.emptyResolved')}
            </p>
          ) : (
            <ul className="divide-y divide-warm-line">
              {visible.map((item) => (
                <FeedbackItem
                  key={item.id}
                  item={item}
                  isPending={pendingIds.has(item.id)}
                  onToggleResolved={onToggleResolved}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

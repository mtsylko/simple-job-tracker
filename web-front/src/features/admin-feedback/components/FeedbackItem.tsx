import { formatDistanceToNowStrict } from 'date-fns';
import { Check, Reply, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AdminFeedback } from '@job-tracker/shared';

import { Button } from '@/components/ui/button';
import { FEEDBACK_KIND_ICONS } from '@/features/feedback/feedback-kind-icons';
import { useDateLocale } from '@/lib/date-locale';

function replyHref(item: AdminFeedback, subject: string): string {
  return `mailto:${item.user.email}?subject=${encodeURIComponent(subject)}`;
}

export function FeedbackItem({
  item,
  isPending,
  onToggleResolved
}: {
  item: AdminFeedback;
  isPending: boolean;
  onToggleResolved: (item: AdminFeedback) => void;
}) {
  const { t } = useTranslation('adminFeedback');
  const locale = useDateLocale();
  const Icon = FEEDBACK_KIND_ICONS[item.kind];
  const createdAt = new Date(item.createdAt);
  // A blank name falls back to the address like a missing one.
  const name = item.user.displayName?.trim() || null;

  return (
    <li className="flex flex-col gap-2.5 px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 self-center text-sm font-medium text-foreground">
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          {t(`feedback:kinds.${item.kind}`)}
        </span>
        <span className="min-w-0 truncate text-sm text-muted-foreground">
          {name
            ? t('item.from', { name, email: item.user.email })
            : item.user.email}
        </span>
        <time
          dateTime={item.createdAt}
          title={createdAt.toLocaleString()}
          className="num ml-auto text-xs text-muted-foreground"
        >
          {formatDistanceToNowStrict(createdAt, { addSuffix: true, locale })}
        </time>
      </div>

      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">
        {item.message}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <dl className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {item.pagePath && (
            <div className="flex min-w-0 gap-1">
              <dt>{t('item.page')}</dt>
              <dd className="truncate text-foreground">{item.pagePath}</dd>
            </div>
          )}
          {item.userAgent && (
            <div className="flex min-w-0 max-w-full gap-1">
              <dt className="shrink-0">{t('item.browser')}</dt>
              <dd className="truncate" title={item.userAgent}>
                {item.userAgent}
              </dd>
            </div>
          )}
        </dl>

        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={replyHref(item, t('item.replySubject'))} />}
            className="text-foreground"
          >
            <Reply aria-hidden="true" />
            {t('item.reply')}
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => onToggleResolved(item)}
          >
            {item.resolvedAt ? (
              <RotateCcw aria-hidden="true" />
            ) : (
              <Check aria-hidden="true" />
            )}
            {item.resolvedAt ? t('item.reopen') : t('item.resolve')}
          </Button>
        </div>
      </div>
    </li>
  );
}

import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

/** The figure under the "Applications" column. */
export function UsageCount({
  count,
  className
}: {
  count: number;
  className?: string;
}) {
  const { t } = useTranslation('taxonomies');

  return (
    <span
      className={cn(
        'num text-center',
        count === 0 ? 'text-muted-foreground' : 'text-foreground',
        className
      )}
    >
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{t('usageCount', { count })}</span>
    </span>
  );
}

/** The same figure in words, on a phone row's second line. */
export function UsageText({
  count,
  className
}: {
  count: number;
  className?: string;
}) {
  const { t } = useTranslation('taxonomies');

  return (
    <span className={cn('num text-xs text-muted-foreground', className)}>
      {t('usageCount', { count })}
    </span>
  );
}

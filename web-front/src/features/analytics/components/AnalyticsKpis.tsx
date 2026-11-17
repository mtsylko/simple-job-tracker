import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

type Kpi = {
  label: string;
  value: number;
  /** A smaller grey figure after the value, such as its share. */
  suffix?: string;
  detail: ReactNode;
};

// Two up until the strip has room for four; each cell draws its own dividers.
const CELL_BORDERS = [
  '',
  'border-l',
  'border-t @2xl:border-t-0 @2xl:border-l',
  'border-t border-l @2xl:border-t-0'
];

export function AnalyticsKpis({ items }: { items: Kpi[] }) {
  const { t } = useTranslation('analytics');

  return (
    <section
      aria-label={t('kpi.label')}
      className="grid grid-cols-2 rounded-lg border border-warm-line bg-card @2xl:grid-cols-4"
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            'flex min-w-0 flex-col gap-1 border-warm-surface-2 px-5 py-4',
            CELL_BORDERS[index]
          )}
        >
          <span className="truncate text-sm text-ink-2">{item.label}</span>
          <span className="num flex items-baseline gap-1.5 text-3xl leading-tight text-foreground">
            {item.value}
            {item.suffix && (
              <span className="text-base text-ink-3">{item.suffix}</span>
            )}
          </span>
          <span className="text-sm text-ink-3">{item.detail}</span>
        </div>
      ))}
    </section>
  );
}

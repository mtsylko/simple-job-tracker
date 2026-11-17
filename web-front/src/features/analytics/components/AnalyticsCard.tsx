import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type AnalyticsCardProps = {
  title: string;
  /** Right of the title: the block's own total or scope, in grey. */
  meta?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function AnalyticsCard({
  title,
  meta,
  className,
  children
}: AnalyticsCardProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'flex min-w-0 flex-col rounded-lg border border-warm-line bg-card px-5 pt-4 pb-5',
        className
      )}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id={titleId}
          className="m-0 font-serif text-lg font-normal text-foreground"
        >
          {title}
        </h2>
        {meta && <span className="num text-sm text-ink-3">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

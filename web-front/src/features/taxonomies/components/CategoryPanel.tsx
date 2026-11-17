import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

/** The frame every category list sits in: column labels and rows. */
export function CategoryPanel({
  columnsClassName,
  columnLabels,
  labelsClassName,
  isLoading,
  error,
  isEmpty,
  children
}: {
  columnsClassName: string;
  /** One cell per grid column, empty ones included, so the labels sit over their values. */
  columnLabels: ReactNode;
  /** Hides the labels where the rows say what their figures are. */
  labelsClassName?: string;
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation('taxonomies');

  return (
    <div className="@container overflow-hidden rounded-xl border border-warm-line bg-card">
      {error ? (
        <p className="px-4 py-3 text-sm text-destructive sm:px-5">{error}</p>
      ) : isLoading ? null : (
        <>
          {!isEmpty && (
            <div
              className={cn(
                'grid items-end gap-x-3 px-4 pb-2 pt-3 text-xs text-muted-foreground sm:px-5',
                columnsClassName,
                labelsClassName
              )}
            >
              {columnLabels}
            </div>
          )}
          <div className={cn(!isEmpty && 'border-t border-warm-line')}>
            {children}
            {isEmpty && (
              <p className="px-4 py-3 text-sm text-muted-foreground sm:px-5">
                {t('empty')}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

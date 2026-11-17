import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

const chipClassName =
  'inline-flex items-center justify-center rounded-full border border-transparent px-2.5 py-1 text-xs font-medium whitespace-nowrap';

/** The default value's chip, or a "Set default" button on every other row. */
export function DefaultChip({
  isDefault,
  disabled,
  onSetDefault,
  className
}: {
  isDefault: boolean;
  disabled?: boolean;
  onSetDefault: () => void;
  className?: string;
}) {
  const { t } = useTranslation('taxonomies');

  const defaultLabel = (
    <>
      <Check className="size-3" aria-hidden="true" />
      {t('default')}
    </>
  );
  const setDefaultLabel = t('setDefault');

  if (isDefault) {
    return (
      <span
        className={cn(chipClassName, 'bg-clay-soft text-clay-ink', className)}
      >
        <SameWidth labels={[defaultLabel, setDefaultLabel]}>
          {defaultLabel}
        </SameWidth>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        chipClassName,
        'cursor-pointer border-warm-line text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default',
        className
      )}
      onClick={onSetDefault}
      disabled={disabled}
    >
      <SameWidth labels={[defaultLabel, setDefaultLabel]}>
        {setDefaultLabel}
      </SameWidth>
    </button>
  );
}

// Room for both labels in every chip, so a column's chips share one width.
function SameWidth({
  labels,
  children
}: {
  labels: ReactNode[];
  children: ReactNode;
}) {
  return (
    <span className="grid">
      {labels.map((label, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="invisible col-start-1 row-start-1 flex items-center justify-center gap-1"
        >
          {label}
        </span>
      ))}
      <span className="col-start-1 row-start-1 flex items-center justify-center gap-1">
        {children}
      </span>
    </span>
  );
}

/** An empty cell exactly as wide as the chips, for the column-label row. */
export function DefaultChipSpacer({ className }: { className?: string }) {
  const { t } = useTranslation('taxonomies');

  return (
    <span
      aria-hidden="true"
      className={cn(chipClassName, 'invisible', className)}
    >
      <SameWidth
        labels={[
          <>
            <Check className="size-3" />
            {t('default')}
          </>,
          t('setDefault')
        ]}
      >
        {null}
      </SameWidth>
    </span>
  );
}

import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

/** The header row for a group, whatever column it was grouped by. */
export function GroupHeaderCell({
  label,
  count,
  isExpanded,
  onToggle
}: {
  label: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation('jobs');

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-full w-full cursor-pointer items-center gap-2 text-left"
    >
      <ChevronRight
        className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        aria-hidden="true"
      />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-sm font-semibold text-foreground">
          {label}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {t('list.table.groupCount', { count })}
        </div>
      </div>
    </button>
  );
}

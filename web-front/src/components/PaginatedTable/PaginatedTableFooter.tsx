import type { ReactNode } from 'react';

type PaginatedTableFooterProps = {
  fromLabel: number;
  toLabel: number;
  totalCount: number;
  itemLabel: string;
  children: ReactNode;
};

export function PaginatedTableFooter({
  fromLabel,
  toLabel,
  totalCount,
  itemLabel,
  children
}: PaginatedTableFooterProps) {
  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Showing {fromLabel}-{toLabel} of {totalCount} {itemLabel}
      </p>
      {children}
    </div>
  );
}

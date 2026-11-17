import { ArrowDown, ArrowUp } from 'lucide-react';
import type { SortDirection } from '@tanstack/react-table';

/** `false` is TanStack's "this column is not the sort column". */
export const SortIndicator = ({
  direction
}: {
  direction: SortDirection | false;
}) => {
  if (!direction) return null;
  const Icon = direction === 'asc' ? ArrowUp : ArrowDown;
  return <Icon className="ml-1.5 inline-block size-3" aria-hidden="true" />;
};

import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { jobEditPath } from '@/app/routes';
import { ROW_OPENER, ROW_OPENER_CLASS } from '@/lib/row-open';
import { cn } from '@/lib/utils';

/** The row's title. It carries the list's filters, so saving returns to the list as it was. */
export function JobOpenLink({
  id,
  className,
  children
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const { search } = useLocation();

  return (
    <Link
      to={{ pathname: jobEditPath(id), search }}
      {...ROW_OPENER}
      className={cn(ROW_OPENER_CLASS, className)}
    >
      {children}
    </Link>
  );
}

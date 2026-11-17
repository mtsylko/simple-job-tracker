import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import { GripVertical } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Wraps a single form field so it can be reordered within its section.
 *
 * Dragging is bound to an explicit handle rather than the whole cell: these cells
 * hold text inputs, date pickers and comboboxes, and making the cell itself the
 * drag source would swallow text selection and click-to-open.
 *
 * `group/sortable` is deliberately not `group/field` — the `Field` primitive
 * already claims that name, and reusing it would cross-trigger both.
 */
export function SortableFormField({
  id,
  index,
  reorderLabel,
  children
}: {
  id: string;
  index: number;
  reorderLabel: string;
  children: ReactNode;
}) {
  const { ref, handleRef, isDragging } = useSortable({ id, index });

  return (
    <div
      ref={ref}
      data-dragging={isDragging || undefined}
      className={cn('group/sortable relative', isDragging && 'z-10 opacity-70')}
    >
      <button
        ref={handleRef}
        type="button"
        aria-label={reorderLabel}
        className="absolute right-0 top-0 flex size-5 cursor-grab items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring group-hover/sortable:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="size-3.5" aria-hidden="true" />
      </button>
      {children}
    </div>
  );
}

import type { ReactElement } from 'react';
import { DragDropProvider } from '@dnd-kit/react';
import { move } from '@dnd-kit/helpers';

import { FieldGroup } from '@/components/ui/field';

import { SortableFormField } from './sortable-form-field';

/**
 * Renders one section's fields in a drag-reorderable list.
 *
 * Each section mounts its own provider, so there is no droppable target outside
 * the section — a field physically cannot be dragged into a neighbouring one.
 */
export function SortableFieldGroup<T extends string>({
  order,
  onOrderChange,
  renderField,
  reorderLabel,
  className
}: {
  order: readonly T[];
  onOrderChange: (next: T[]) => void;
  /**
   * Returns `ReactElement`, not `ReactNode`, on purpose: `undefined` is a valid
   * `ReactNode`, so a `switch` that forgot a case would type-check and render an
   * empty slot with a drag handle. Requiring an element makes the omission a
   * compile error in the section that owns the switch.
   */
  renderField: (field: T) => ReactElement;
  reorderLabel: string;
  className?: string;
}) {
  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) {
          return;
        }
        onOrderChange(move([...order], event));
      }}
    >
      <FieldGroup className={className}>
        {order.map((field, index) => (
          <SortableFormField
            key={field}
            id={field}
            index={index}
            reorderLabel={reorderLabel}
          >
            {renderField(field)}
          </SortableFormField>
        ))}
      </FieldGroup>
    </DragDropProvider>
  );
}

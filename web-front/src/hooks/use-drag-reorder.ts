import { useState } from 'react';

export function useDragReorder<T extends { id: string }>(
  items: T[],
  onReorder: (orderedIds: string[]) => Promise<void>
) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const reset = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      reset();
      return;
    }

    const ids = items.map((item) => item.id);
    const fromIndex = ids.indexOf(draggedId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) {
      reset();
      return;
    }

    const reordered = [...ids];
    reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, draggedId);

    reset();
    void onReorder(reordered);
  };

  // The keyboard and touch way to reorder, where dragging is unavailable.
  const moveBy = (id: string, delta: -1 | 1) => {
    const ids = items.map((item) => item.id);
    const fromIndex = ids.indexOf(id);
    const toIndex = fromIndex + delta;
    if (fromIndex === -1 || toIndex < 0 || toIndex >= ids.length) {
      return;
    }

    [ids[fromIndex], ids[toIndex]] = [ids[toIndex], ids[fromIndex]];
    void onReorder(ids);
  };

  return {
    moveBy,
    isDragging: (id: string) => draggedId === id || dragOverId === id,
    getRowDragHandlers: (id: string) => ({
      onDragStart: () => setDraggedId(id),
      onDragOver: () => setDragOverId(id),
      onDrop: () => handleDrop(id),
      onDragEnd: reset
    })
  };
}

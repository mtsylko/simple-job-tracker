import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { ROW_OPENER } from '@/lib/row-open';

/** Edit and Delete, always in view, as they were before the redesign. Edit is also what a click on the row does. */
export function RowActions({
  value,
  isEditing,
  onEdit,
  onDelete
}: {
  value: string;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const { t } = useTranslation('taxonomies');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setIsDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="text-muted-foreground"
        {...ROW_OPENER}
        onClick={onEdit}
        disabled={isEditing}
        aria-label={t('edit')}
      >
        <Pencil aria-hidden="true" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="text-muted-foreground"
        onClick={() => setIsDeleteOpen(true)}
        aria-label={t('delete')}
      >
        <Trash2 aria-hidden="true" />
      </Button>

      <Modal
        open={isDeleteOpen}
        tone="danger"
        title={t('deleteDialog.title', { value })}
        description={t('deleteDialog.body')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        confirmPending={isDeleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}

import { useTranslation } from 'react-i18next';

import { Modal } from '@/components/Modal';

type Props = {
  open: boolean;
  dirtyFieldLabels: string[];
  onKeepEditing: () => void;
  onDiscard: () => void;
};

export function UnsavedChangesDialog({
  open,
  dirtyFieldLabels,
  onKeepEditing,
  onDiscard
}: Props) {
  const { t } = useTranslation('common');

  return (
    <Modal
      open={open}
      tone="danger"
      title={t('form.discardDialog.title')}
      description={t('form.discardDialog.body')}
      cancelLabel={t('form.discardDialog.keepEditing')}
      confirmLabel={t('form.discardDialog.discardChanges')}
      onConfirm={onDiscard}
      onCancel={onKeepEditing}
    >
      {dirtyFieldLabels.length > 0 && (
        <ul className="list-none rounded-md bg-secondary px-3.5 py-3 text-xs">
          {dirtyFieldLabels.map((label) => (
            <li
              key={label}
              className="flex items-center gap-2 py-[3px] before:size-[5px] before:shrink-0 before:rounded-full before:[background:var(--clay)]"
            >
              <span className="font-medium text-foreground">{label}</span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

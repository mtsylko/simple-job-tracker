import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LANGUAGES, type Language } from '@/app/language';
import { Modal } from '@/components/Modal';
import { TranslationValueField } from '@/features/admin-translations/components/TranslationValueField';
import {
  currentText,
  type TranslationRow
} from '@/features/admin-translations/translation-catalog';

type Values = Partial<Record<Language, string>>;

function initialValues(row: TranslationRow): Values {
  const values: Values = {};
  for (const language of LANGUAGES) {
    if (row.defaults[language] !== undefined) {
      values[language] = currentText(row, language);
    }
  }
  return values;
}

/** Edits every language of one string; mounted per row, so its draft starts fresh each time. */
export function TranslationEditDialog({
  row,
  sectionLabel,
  isSaving,
  onSave,
  onCancel
}: {
  row: TranslationRow;
  sectionLabel: string;
  isSaving: boolean;
  onSave: (values: Values) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation('adminTranslations');
  const [values, setValues] = useState<Values>(() => initialValues(row));
  const firstFieldRef = useRef<HTMLTextAreaElement>(null);

  const languages = LANGUAGES.filter(
    (language) => row.defaults[language] !== undefined
  );
  const hasEmpty = languages.some(
    (language) => (values[language] ?? '').trim().length === 0
  );
  const hasChanges = languages.some(
    (language) => values[language] !== currentText(row, language)
  );

  return (
    <Modal
      open
      title={t('edit.title')}
      description={
        <span className="flex flex-col gap-0.5">
          <span>{sectionLabel}</span>
          <span className="break-all font-mono text-xs">
            {row.namespace}:{row.key}
          </span>
        </span>
      }
      cancelLabel={t('edit.cancel')}
      confirmLabel={t('edit.save')}
      confirmPending={isSaving}
      confirmDisabled={hasEmpty || !hasChanges}
      initialFocus={firstFieldRef}
      onConfirm={() => onSave(values)}
      onCancel={onCancel}
    >
      <div className="flex flex-col gap-5">
        {languages.map((language, index) => (
          <TranslationValueField
            key={language}
            id={`translation-${language}`}
            language={language}
            shipped={row.defaults[language] ?? ''}
            value={values[language] ?? ''}
            textareaRef={index === 0 ? firstFieldRef : undefined}
            onChange={(value) =>
              setValues((current) => ({ ...current, [language]: value }))
            }
          />
        ))}
      </div>
    </Modal>
  );
}

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { SelectField } from '@/components/ui/select-field';

import { useJobFieldOptions } from './use-job-field-options';

export function EditableSelectField({
  id,
  value,
  onChange,
  values,
  onPersist,
  addNewOptionLabel,
  newOptionPlaceholder,
  placeholder
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  values: string[];
  onPersist: (value: string) => Promise<void>;
  addNewOptionLabel: string;
  newOptionPlaceholder: string;
  placeholder: string;
}) {
  const { t } = useTranslation('common');
  const fieldState = useJobFieldOptions({
    values,
    currentValue: value,
    onPersist
  });

  const selectedValue = fieldState.isAddingNew ? '' : value.trim();
  // Cancelling "add new" puts back what was selected before it.
  const valueBeforeAdding = useRef('');

  return (
    <>
      <SelectField
        id={id}
        options={fieldState.mergedOptions}
        value={selectedValue}
        onChange={(nextValue) => {
          fieldState.setIsAddingNew(false);
          onChange(nextValue);
        }}
        onAddNewOption={() => {
          valueBeforeAdding.current = value;
          fieldState.setIsAddingNew(true);
          onChange('');
        }}
        addNewOptionLabel={addNewOptionLabel}
        isAddingNewOption={fieldState.isAddingNew}
        newOptionValue={value}
        onNewOptionValueChange={onChange}
        onAcceptAddNewOption={() => fieldState.handleAccept(onChange)}
        onCancelAddNewOption={() => {
          fieldState.setIsAddingNew(false);
          onChange(valueBeforeAdding.current);
        }}
        newOptionPlaceholder={newOptionPlaceholder}
        acceptAddNewOptionLabel={t('selectField.accept')}
        cancelAddNewOptionLabel={t('selectField.cancel')}
        placeholder={placeholder}
      />
      {fieldState.error && (
        <p className="mt-1 text-xs text-destructive">{fieldState.error}</p>
      )}
    </>
  );
}

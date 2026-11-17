import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeUniqueValues } from './job-form.schema';

export function useJobFieldOptions({
  values,
  currentValue,
  onPersist
}: {
  values: string[];
  currentValue: string;
  onPersist: (value: string) => Promise<void>;
}) {
  const { t } = useTranslation('jobs');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The saved value is appended so editing a job whose option was since deleted
  // still shows what it is set to, instead of rendering as an empty select.
  const mergedOptions = useMemo(
    () =>
      normalizeUniqueValues([...values, currentValue]).map((value) => ({
        value,
        label: value
      })),
    [values, currentValue]
  );

  const handleAccept = async (onAccepted: (value: string) => void) => {
    const trimmed = currentValue.trim();
    if (!trimmed) {
      setError(t('form.validation.valueRequired'));
      return;
    }

    try {
      await onPersist(trimmed);
      setError(null);
      setIsAddingNew(false);
      onAccepted(trimmed);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('form.validation.failedToSaveOption')
      );
    }
  };

  return {
    mergedOptions,
    isAddingNew,
    setIsAddingNew,
    error,
    setError,
    handleAccept
  };
}

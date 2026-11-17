import { useMemo, useRef, useState } from 'react';
import { useBeforeUnload } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import type { JobFormValues } from '@/features/jobs/types';

import { getDirtyFieldLabels } from './job-form.schema';

export function useDirtyFormGuard({
  values,
  initialValues,
  extraDirtyLabels = []
}: {
  values: JobFormValues;
  initialValues: JobFormValues;
  /** Changes held outside the form values, such as attachments waiting for save. */
  extraDirtyLabels?: string[];
}) {
  const { t } = useTranslation('jobs');

  const dirtyFieldLabels = useMemo(() => {
    const labels = getDirtyFieldLabels(t);
    return (Object.keys(values) as (keyof JobFormValues)[])
      .filter(
        (key) =>
          JSON.stringify(values[key]) !== JSON.stringify(initialValues[key])
      )
      .map((key) => labels[key])
      .concat(extraDirtyLabels);
  }, [values, initialValues, extraDirtyLabels, t]);

  const isDirty = dirtyFieldLabels.length > 0;

  // Warn on browser tab close / refresh when dirty.
  useBeforeUnload(
    (event) => {
      if (isDirty) event.preventDefault();
    },
    { capture: true }
  );

  // Manual dialog state for in-app navigation (Cancel button, Back link).
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const pendingNavRef = useRef<(() => void) | null>(null);

  function guardNavigation(action: () => void) {
    if (isDirty) {
      pendingNavRef.current = action;
      setShowDiscardDialog(true);
    } else {
      action();
    }
  }

  function onKeepEditing() {
    setShowDiscardDialog(false);
    pendingNavRef.current = null;
  }

  function onDiscard() {
    setShowDiscardDialog(false);
    pendingNavRef.current?.();
    pendingNavRef.current = null;
  }

  return {
    isDirty,
    dirtyFieldLabels,
    showDiscardDialog,
    guardNavigation,
    onKeepEditing,
    onDiscard
  };
}

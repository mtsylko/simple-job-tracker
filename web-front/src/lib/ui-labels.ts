import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { FileUploadFieldLabels } from '@/components/ui/file-upload-field';
import type { SearchComboboxFieldLabels } from '@/components/ui/search-combobox-field';

/** The vendored file upload's built-in copy, in the UI language. */
export function useFileUploadLabels(): FileUploadFieldLabels {
  const { t } = useTranslation('common');

  return useMemo(
    () => ({
      dropTitle: t('fileUpload.dropTitle'),
      dropHint: t('fileUpload.dropHint'),
      uploadingTitle: t('fileUpload.uploadingTitle'),
      uploadingHint: t('fileUpload.uploadingHint'),
      acceptedFormats: (formats) =>
        t('fileUpload.acceptedFormats', { formats }),
      maxSize: (size) => t('fileUpload.maxSize', { size }),
      unsupportedFormat: (formats) =>
        t('fileUpload.unsupportedFormat', { formats }),
      tooLarge: (size) => t('fileUpload.tooLarge', { size }),
      uploadFailed: t('fileUpload.uploadFailed'),
      clearFile: t('fileUpload.clearFile')
    }),
    [t]
  );
}

/** The vendored search combobox's built-in copy, in the UI language. */
export function useSearchComboboxLabels(): SearchComboboxFieldLabels {
  const { t } = useTranslation('common');

  return useMemo(
    () => ({
      searching: t('search.searching'),
      searchFailed: t('search.failed'),
      minLetters: (count) => t('search.minLetters', { count }),
      noResults: t('search.noResults')
    }),
    [t]
  );
}

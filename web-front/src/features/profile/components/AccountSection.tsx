import { useRef, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/app/routes';
import { clearTaxonomyCache } from '@/features/taxonomies/taxonomy-store';

import { deleteAccount, downloadAccountExport } from '../account-api';

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : fallback;
}

/** Export of everything the account holds, and its deletion. */
export function AccountSection() {
  const { t } = useTranslation(['profile', 'legal']);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const phraseInputRef = useRef<HTMLInputElement>(null);
  const [typedPhrase, setTypedPhrase] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // A phrase the browser cannot autofill, unlike the account email.
  const phrase = t('account.delete.phrase');
  const phraseMatches =
    typedPhrase.trim().replace(/\s+/g, ' ').toLowerCase() ===
    phrase.toLowerCase();

  async function handleExport() {
    setIsExporting(true);
    setExportError(null);
    try {
      await downloadAccountExport();
    } catch (error) {
      setExportError(errorText(error, t('account.export.failed')));
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      clearTaxonomyCache();
      // A full load, so no state from the deleted account survives.
      window.location.replace(ROUTES.signIn);
    } catch (error) {
      setDeleteError(errorText(error, t('account.delete.failed')));
      setIsDeleting(false);
    }
  }

  function closeDelete() {
    setIsDeleteOpen(false);
    setTypedPhrase('');
    setDeleteError(null);
  }

  return (
    <div className="max-w-3xl rounded-2xl border border-border bg-card p-7.5">
      <FieldSet>
        <FieldLegend>{t('account.export.title')}</FieldLegend>
        <FieldDescription>{t('account.export.body')}</FieldDescription>
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={() => void handleExport()}
          >
            <Download aria-hidden="true" />
            {isExporting
              ? t('account.export.pending')
              : t('account.export.action')}
          </Button>
          {exportError && (
            <p className="mt-2 text-xs text-destructive">{exportError}</p>
          )}
        </div>
      </FieldSet>

      <div className="my-6 border-t border-border" />

      <FieldSet>
        <FieldLegend>{t('account.delete.title')}</FieldLegend>
        <FieldDescription>{t('account.delete.body')}</FieldDescription>
        <div>
          <Button
            type="button"
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 aria-hidden="true" />
            {t('account.delete.action')}
          </Button>
        </div>
      </FieldSet>

      <div className="my-6 border-t border-border" />

      <FieldSet>
        <FieldLegend>{t('accountLinks.title', { ns: 'legal' })}</FieldLegend>
        <FieldDescription>
          {t('accountLinks.body', { ns: 'legal' })}
        </FieldDescription>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link
            to={ROUTES.privacy}
            className="text-clay underline underline-offset-2 hover:text-ink"
          >
            {t('nav.privacy', { ns: 'legal' })}
          </Link>
          <Link
            to={ROUTES.terms}
            className="text-clay underline underline-offset-2 hover:text-ink"
          >
            {t('nav.terms', { ns: 'legal' })}
          </Link>
        </div>
      </FieldSet>

      <Modal
        open={isDeleteOpen}
        tone="danger"
        title={t('account.delete.confirmTitle')}
        description={t('account.delete.confirmBody')}
        confirmLabel={t('account.delete.confirm')}
        cancelLabel={t('account.delete.cancel')}
        confirmPending={isDeleting}
        confirmDisabled={!phraseMatches}
        initialFocus={phraseInputRef}
        onConfirm={() => void handleDelete()}
        onCancel={closeDelete}
      >
        <Field className="gap-1.5">
          <FieldLabel htmlFor="account-delete-phrase">
            {t('account.delete.phraseLabel', { phrase })}
          </FieldLabel>
          <Input
            ref={phraseInputRef}
            id="account-delete-phrase"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={typedPhrase}
            onChange={(event) => setTypedPhrase(event.currentTarget.value)}
            disabled={isDeleting}
          />
          {deleteError && (
            <p className="text-xs text-destructive">{deleteError}</p>
          )}
        </Field>
      </Modal>
    </div>
  );
}

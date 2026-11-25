import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { ExternalLink, FileStack, Plus, Search } from 'lucide-react';

import { cvVersionEditPath, ROUTES } from '@/app/routes';
import { EmptyState as EmptyStateLayout } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { SelectField } from '@/components/ui/select-field';
import {
  attachmentLabel,
  downloadAttachment
} from '@/features/cv-versions/attachment';
import { CvAttachmentViewer } from '@/features/cv-versions/components/CvAttachmentViewer';
import { CvRowMenu } from '@/features/cv-versions/components/CvRowMenu';
import { CvVersionsCardList } from '@/features/cv-versions/components/CvVersionsCardList';
import type { CvVersionRow } from '@/features/cv-versions/types';
import {
  notify,
  notifyActionError,
  notifyActionSuccess
} from '@/lib/notifications';
import {
  ROW_OPEN_CLASS,
  ROW_OPENER,
  ROW_OPENER_CLASS,
  rowOpenHandlers
} from '@/lib/row-open';
import { cn } from '@/lib/utils';

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation('cvVersions');

  const features = [
    {
      key: 'tailor',
      title: t('empty.features.tailor.title'),
      description: t('empty.features.tailor.description')
    },
    {
      key: 'usage',
      title: t('empty.features.usage.title'),
      description: t('empty.features.usage.description')
    },
    {
      key: 'source',
      title: t('empty.features.source.title'),
      description: t('empty.features.source.description')
    }
  ];

  return (
    <EmptyStateLayout
      icon={FileStack}
      title={t('empty.title')}
      subtitle={t('empty.subtitle')}
      ctaLabel={t('empty.cta')}
      features={features}
      onAdd={onAdd}
    />
  );
}

/** Which versions the list shows, as the applications list scopes its rows. */
type CvScope = 'active' | 'archived' | 'all';

// ─── List page ────────────────────────────────────────────────────────────────

export function CvVersionsListPage({
  cvVersions,
  onDelete,
  onToggleEnabled
}: {
  cvVersions: CvVersionRow[];
  onDelete: (id: string) => Promise<void>;
  onToggleEnabled: (id: string, enabled: boolean) => Promise<void>;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('cvVersions');
  const [scope, setScope] = useState<CvScope>('active');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await onDelete(id);
        notifyActionSuccess('deleted', 'cvVersion');
        setPendingDeleteId(null);
      } catch (error) {
        // Keep the dialog open so the user can retry after the error toast.
        notifyActionError('deleted', 'cvVersion', error);
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete]
  );

  const handleDownload = useCallback(
    async (attachment: string) => {
      try {
        await downloadAttachment(attachment, attachmentLabel(attachment));
      } catch (error) {
        notify.error(
          t('viewer.downloadFailed'),
          error instanceof Error ? error.message : undefined
        );
      }
    },
    [t]
  );

  // The Undo: the same request the other way, reported without an Undo of its own
  const undoArchive = useCallback(
    (cv: CvVersionRow, enabled: boolean) => {
      void onToggleEnabled(cv.id, enabled)
        .then(() =>
          notifyActionSuccess(enabled ? 'restored' : 'archived', 'cvVersion')
        )
        .catch((error: unknown) =>
          notifyActionError(
            enabled ? 'restored' : 'archived',
            'cvVersion',
            error
          )
        );
    },
    [onToggleEnabled]
  );

  // Archiving a version takes it out of the CV picker; the same request as before, the applications' words
  const handleToggleArchive = useCallback(
    async (cv: CvVersionRow) => {
      const enabled = !cv.enabled;
      const action = enabled ? 'restored' : 'archived';
      setTogglingId(cv.id);
      try {
        await onToggleEnabled(cv.id, enabled);
        notifyActionSuccess(action, 'cvVersion', {
          undo: () => undoArchive(cv, !enabled)
        });
      } catch (error) {
        notifyActionError(action, 'cvVersion', error);
      } finally {
        setTogglingId(null);
      }
    },
    [onToggleEnabled, undoArchive]
  );

  // Scope first, as the applications list does: it decides which rows exist before the search
  const scoped = cvVersions.filter((cv) => {
    if (scope === 'active') return cv.enabled;
    if (scope === 'archived') return !cv.enabled;
    return true;
  });
  const scopeOptions = [
    { value: 'active', label: t('list.scope.active') },
    { value: 'archived', label: t('list.scope.archived') },
    { value: 'all', label: t('list.scope.all') }
  ];

  // Search filtering
  const filtered = search.trim()
    ? scoped.filter(
        (cv) =>
          cv.name.toLowerCase().includes(search.toLowerCase()) ||
          attachmentLabel(cv.attachment)
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          cv.description.toLowerCase().includes(search.toLowerCase())
      )
    : scoped;

  const previewCv = cvVersions.find((cv) => cv.id === previewId) ?? null;

  const hasVersions = cvVersions.length > 0;

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-5 pb-4 sm:px-7 sm:pt-7 sm:pb-5">
        <h1 className="m-0 font-serif text-display font-light leading-display tracking-tight text-foreground">
          {t('list.title')}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="lg"
            className="gap-1.5"
            onClick={() => navigate(ROUTES.cvVersionsCreate)}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {t('list.newCvVersion')}
          </Button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!hasVersions && (
        <EmptyState onAdd={() => navigate(ROUTES.cvVersionsCreate)} />
      )}

      {/* ── Filters + table ── */}
      {hasVersions && (
        <>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-4 sm:px-7">
            <label className="flex w-[220px] items-center gap-1.5 rounded-md border border-warm-line bg-card px-2.5 py-[7px] text-sm">
              <Search
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                aria-label={t('list.searchLabel')}
                className="flex-1 border-none bg-transparent outline-none placeholder:text-muted-foreground"
                placeholder={t('list.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label htmlFor="cv-list-scope" className="sr-only">
              {t('list.scopeLabel')}
            </label>
            <SelectField
              id="cv-list-scope"
              className="w-40"
              options={scopeOptions}
              value={scope}
              onChange={(value) => setScope(value as CvScope)}
            />

            {/* "X of N", always, so the row holds its width as the scope changes */}
            <div className="ml-auto text-sm text-muted-foreground">
              <Trans
                t={t}
                i18nKey="list.matchingCount"
                values={{ filtered: filtered.length, total: scoped.length }}
                components={{
                  filtered: (
                    <span
                      className="num inline-block text-right font-medium text-foreground"
                      style={{ minWidth: `${String(scoped.length).length}ch` }}
                    />
                  ),
                  total: <span className="num" />
                }}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Phones get cards, as the applications list does */}
            <div className="mx-4 mb-20 md:hidden">
              <CvVersionsCardList
                cvVersions={filtered}
                deletingId={deletingId}
                togglingId={togglingId}
                onEdit={(id) => navigate(cvVersionEditPath(id))}
                onPreview={setPreviewId}
                onDownload={(attachment) => void handleDownload(attachment)}
                onDelete={setPendingDeleteId}
                showArchivedMarker={scope === 'all'}
                onToggleArchive={(target) => void handleToggleArchive(target)}
              />
            </div>

            {/* Table */}
            <div className="mx-4 mb-20 hidden overflow-hidden rounded-2xl border bg-card border-warm-line sm:mx-7 md:block">
              {/* Scroll sideways on narrow screens rather than crushing columns. */}
              <div className="overflow-x-auto">
                <table
                  className="w-full border-collapse text-sm"
                  style={{ tableLayout: 'fixed', minWidth: 860 }}
                >
                  <thead>
                    <tr>
                      <th className="cv-th" style={{ width: 320 }}>
                        {t('list.columns.version')}
                      </th>
                      <th className="cv-th">{t('list.columns.description')}</th>
                      <th className="cv-th" style={{ width: 130 }}>
                        {t('list.columns.source')}
                      </th>
                      <th className="cv-th" style={{ width: 92 }}>
                        <span className="sr-only">{t('list.menu.column')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((cv) => {
                      return (
                        <tr
                          key={cv.id}
                          {...rowOpenHandlers}
                          className={cn('group', ROW_OPEN_CLASS)}
                          style={{ borderBottom: '1px solid var(--warm-line)' }}
                        >
                          {/* CV version: name + filename */}
                          <td className="cv-td">
                            <div className="min-w-0">
                              <Link
                                to={cvVersionEditPath(cv.id)}
                                {...ROW_OPENER}
                                className={cn(
                                  'block text-sm font-medium leading-tight',
                                  ROW_OPENER_CLASS
                                )}
                                style={{ color: 'var(--ink)' }}
                              >
                                {cv.name}
                              </Link>
                              {cv.attachment.trim().length > 0 && (
                                <button
                                  type="button"
                                  title={t('viewer.preview')}
                                  className="mt-0.5 block max-w-full truncate border-0 bg-transparent p-0 text-left text-xs text-ink-3 hover:text-ink-2 hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewId(cv.id);
                                  }}
                                >
                                  {attachmentLabel(cv.attachment)}
                                </button>
                              )}
                              {scope === 'all' && !cv.enabled && (
                                <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
                                  {t('list.archivedMarker')}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Description */}
                          <td className="cv-td">
                            {cv.description.trim().length > 0 ? (
                              <span className="text-ink-2">
                                {cv.description}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Source link */}
                          <td className="cv-td" style={{ width: 130 }}>
                            {cv.sourceLink.trim().length > 0 ? (
                              <a
                                href={cv.sourceLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-ink-2 no-underline transition-colors hover:text-clay"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {t('list.openSource')}
                                <ExternalLink
                                  className="size-3"
                                  aria-hidden="true"
                                />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          {/* Actions: the preview in view, the rest in one menu */}
                          <td className="cv-td" style={{ width: 92 }}>
                            <CvRowMenu
                              cv={cv}
                              disabled={
                                deletingId === cv.id || togglingId === cv.id
                              }
                              onToggleArchive={(target) =>
                                void handleToggleArchive(target)
                              }
                              onEdit={(id) => navigate(cvVersionEditPath(id))}
                              onPreview={setPreviewId}
                              onDownload={(attachment) =>
                                void handleDownload(attachment)
                              }
                              onDelete={setPendingDeleteId}
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-10 text-center">
                          <div className="font-serif text-lg font-normal text-foreground">
                            {t('list.noMatch')}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Delete confirmation ── */}
      <Modal
        open={pendingDeleteId !== null}
        tone="danger"
        title={t('deleteDialog.title')}
        description={
          <Trans
            t={t}
            i18nKey="deleteDialog.body"
            values={{
              name: cvVersions.find((cv) => cv.id === pendingDeleteId)?.name
            }}
            components={{
              name: <strong className="font-medium text-foreground" />
            }}
          />
        }
        confirmLabel={t('deleteDialog.confirm')}
        cancelLabel={t('deleteDialog.cancel')}
        confirmPending={deletingId === pendingDeleteId}
        onConfirm={() => {
          if (pendingDeleteId) {
            void handleDelete(pendingDeleteId);
          }
        }}
        onCancel={() => setPendingDeleteId(null)}
      />

      {/* ── PDF preview ── */}
      {previewCv && (
        <CvAttachmentViewer
          attachment={previewCv.attachment}
          title={previewCv.name}
          open
          onOpenChange={(open) => {
            if (!open) setPreviewId(null);
          }}
        />
      )}
    </main>
  );
}

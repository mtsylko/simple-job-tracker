import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  Download,
  Eye,
  ExternalLink,
  FileStack,
  Info,
  Plus,
  Search,
  Trash2
} from 'lucide-react';

import { cvVersionEditPath, ROUTES } from '@/app/routes';
import { EmptyState as EmptyStateLayout } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { PageTabs, type PageTab } from '@/components/PageTabs';
import { Button } from '@/components/ui/button';
import {
  attachmentLabel,
  downloadAttachment
} from '@/features/cv-versions/attachment';
import { CvAttachmentViewer } from '@/features/cv-versions/components/CvAttachmentViewer';
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

// ─── Row toggle ───────────────────────────────────────────────────────────────

function RowToggle({
  on,
  disabled,
  onChange
}: {
  on: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  const { t } = useTranslation('cvVersions');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      title={on ? t('list.toggle.onHint') : t('list.toggle.offHint')}
      onClick={() => onChange(!on)}
      style={{
        width: 30,
        height: 18,
        borderRadius: 99,
        border: 'none',
        padding: 2,
        background: on ? 'var(--clay)' : 'var(--warm-line-2)',
        display: 'inline-flex',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background .15s ease',
        flexShrink: 0
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 99,
          background: '#fff',
          transform: on ? 'translateX(12px)' : 'translateX(0)',
          transition: 'transform .15s ease',
          boxShadow: '0 1px 2px rgba(0,0,0,.2)'
        }}
      />
    </button>
  );
}

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

type TabKey = 'all' | 'enabled' | 'disabled';

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
  const [activeTab, setActiveTab] = useState<TabKey>('all');
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

  const handleToggle = useCallback(
    async (id: string, next: boolean) => {
      setTogglingId(id);
      try {
        await onToggleEnabled(id, next);
      } catch (error) {
        notifyActionError('updated', 'cvVersion', error);
      } finally {
        setTogglingId(null);
      }
    },
    [onToggleEnabled]
  );

  // Tab filtering
  const tabFiltered = cvVersions.filter((cv) => {
    if (activeTab === 'enabled') return cv.enabled;
    if (activeTab === 'disabled') return !cv.enabled;
    return true;
  });

  // Search filtering
  const filtered = search.trim()
    ? tabFiltered.filter(
        (cv) =>
          cv.name.toLowerCase().includes(search.toLowerCase()) ||
          attachmentLabel(cv.attachment)
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          cv.description.toLowerCase().includes(search.toLowerCase())
      )
    : tabFiltered;

  const previewCv = cvVersions.find((cv) => cv.id === previewId) ?? null;

  const enabledCount = cvVersions.filter((cv) => cv.enabled).length;
  const disabledCount = cvVersions.filter((cv) => !cv.enabled).length;
  const hasVersions = cvVersions.length > 0;

  const TABS: PageTab<TabKey>[] = [
    { key: 'all', label: t('list.tabs.all'), count: cvVersions.length },
    { key: 'enabled', label: t('list.tabs.enabled'), count: enabledCount },
    { key: 'disabled', label: t('list.tabs.disabled'), count: disabledCount }
  ];

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-5 pb-4 sm:px-7 sm:pt-7 sm:pb-5">
        <h1 className="m-0 font-serif text-3xl font-normal leading-display tracking-tight text-foreground">
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

      {/* ── Tabs ── */}
      <PageTabs tabs={TABS} value={activeTab} onChange={setActiveTab} />

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

            <div className="ml-auto text-xs text-muted-foreground">
              {filtered.length !== cvVersions.length ? (
                <Trans
                  t={t}
                  i18nKey="list.shownOfTotal"
                  values={{ shown: filtered.length, total: cvVersions.length }}
                  components={{
                    strong: <strong className="font-medium text-foreground" />
                  }}
                />
              ) : (
                <>
                  <Trans
                    t={t}
                    i18nKey="list.versionCount"
                    count={cvVersions.length}
                    components={{
                      strong: <strong className="font-medium text-foreground" />
                    }}
                  />
                  {disabledCount > 0 && (
                    <span className="ml-1.5 text-muted-foreground">
                      · {t('list.disabledCount', { count: disabledCount })}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Table */}
            <div className="mx-4 mb-20 overflow-hidden rounded-2xl border bg-card border-warm-line sm:mx-7">
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
                      <th
                        className="cv-th"
                        style={{ width: 120, textAlign: 'center' }}
                      >
                        {t('list.columns.enabled')}
                      </th>
                      <th
                        className="cv-th"
                        style={{ width: 124, textAlign: 'right' }}
                      ></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((cv) => {
                      const muted = !cv.enabled;
                      return (
                        <tr
                          key={cv.id}
                          {...rowOpenHandlers}
                          className={cn('group', ROW_OPEN_CLASS)}
                          style={{
                            borderBottom: '1px solid var(--warm-line)',
                            opacity: muted ? 0.62 : 1
                          }}
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
                                style={{
                                  color: 'var(--ink)',
                                  textDecorationLine: muted
                                    ? 'line-through'
                                    : 'none',
                                  textDecorationColor: 'var(--ink-3)'
                                }}
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

                          {/* Enabled toggle */}
                          {/* Toggling enabled must not open the record */}
                          <td
                            className="cv-td cursor-default"
                            style={{ width: 120, textAlign: 'center' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-2">
                              <RowToggle
                                on={cv.enabled}
                                disabled={togglingId === cv.id}
                                onChange={(next) =>
                                  void handleToggle(cv.id, next)
                                }
                              />
                              <span
                                className="text-xs"
                                style={{
                                  color: cv.enabled
                                    ? 'var(--ink-2)'
                                    : 'var(--ink-3)',
                                  minWidth: 24
                                }}
                              >
                                {cv.enabled
                                  ? t('list.toggle.on')
                                  : t('list.toggle.off')}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td
                            className="cv-td"
                            style={{ width: 124, textAlign: 'right' }}
                          >
                            <div className="flex items-center justify-end gap-1">
                              {cv.attachment.trim().length > 0 && (
                                <>
                                  <button
                                    type="button"
                                    title={t('viewer.preview')}
                                    className="cv-icon-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewId(cv.id);
                                    }}
                                  >
                                    <Eye
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    title={t('viewer.download')}
                                    className="cv-icon-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleDownload(cv.attachment);
                                    }}
                                  >
                                    <Download
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                title={t('list.deleteLabel', {
                                  name: cv.name
                                })}
                                className="cv-icon-btn"
                                disabled={deletingId === cv.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingDeleteId(cv.id);
                                }}
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center">
                          <div className="font-serif text-lg font-normal text-foreground">
                            {t('list.noMatch')}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div
                className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                style={{
                  borderTop: '1px solid var(--warm-line)',
                  color: 'var(--ink-3)',
                  background: 'var(--warm-surface)'
                }}
              >
                <div>
                  <Trans
                    t={t}
                    i18nKey="list.footer.showing"
                    count={filtered.length}
                    components={{ strong: <strong className="text-ink" /> }}
                  />
                  {(enabledCount > 0 || disabledCount > 0) && (
                    <>
                      {' · '}
                      <span className="text-ink-3">
                        {disabledCount > 0
                          ? t('list.footer.enabledAndDisabled', {
                              enabled: enabledCount,
                              disabled: disabledCount
                            })
                          : t('list.footer.enabled', { enabled: enabledCount })}
                      </span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border-0 bg-transparent px-2 py-1 text-xs font-medium hover:bg-muted text-ink-2"
                  onClick={() => navigate(ROUTES.cvVersionsCreate)}
                >
                  <Plus className="size-3" aria-hidden="true" />
                  {t('list.addAnother')}
                </button>
              </div>
            </div>

            {/* Info banner */}
            <div className="mx-4 mb-7 flex items-center gap-3 rounded-md border px-4 py-3 text-xs border-warm-line bg-warm-surface text-ink-2 sm:mx-7">
              <Info className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
              <p className="flex-1 leading-normal">{t('list.disabledInfo')}</p>
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

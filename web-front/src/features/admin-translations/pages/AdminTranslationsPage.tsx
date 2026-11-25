import {
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState
} from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TranslationOverride } from '@job-tracker/shared';

import type { Language } from '@/app/language';
import { Modal } from '@/components/Modal';
import { PageTabs } from '@/components/PageTabs';
import { SelectField } from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@/components/ui/input-group';
import { TranslationEditDialog } from '@/features/admin-translations/components/TranslationEditDialog';
import {
  TranslationsTable,
  TranslationsTableSkeleton
} from '@/features/admin-translations/components/TranslationsTable';
import {
  NAMESPACES,
  buildRows,
  isEdited,
  matchesQuery,
  sectionLabelKey,
  sortBySection,
  type SectionLabels,
  type TranslationRow
} from '@/features/admin-translations/translation-catalog';
import type { AdminTranslationsState } from '@/features/admin-translations/use-admin-translations';
import { findNearestScrollContainer } from '@/hooks/use-infinite-scroll-batches';
import { useLauncherClearance } from '@/hooks/use-launcher-clearance';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type TranslationsTab = 'all' | 'edited';

const ALL_NAMESPACES = 'all';

const NAMESPACE_SELECT_ID = 'translations-namespace';

export function AdminTranslationsPage({
  state,
  onSave,
  onRemoveOrphans
}: {
  state: AdminTranslationsState;
  onSave: (
    row: TranslationRow,
    values: Partial<Record<Language, string>>
  ) => Promise<boolean>;
  onRemoveOrphans: (orphans: TranslationOverride[]) => Promise<boolean>;
}) {
  const { t } = useTranslation('adminTranslations');
  const [tab, setTab] = useState<TranslationsTab>('all');
  const [namespace, setNamespace] = useState(ALL_NAMESPACES);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingOrphans, setConfirmingOrphans] = useState(false);
  const [isRemovingOrphans, setIsRemovingOrphans] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  // Phones scroll the page, whose own padding clears the launcher.
  const needsClearance =
    useLauncherClearance(scrollerRef, contentRef) && !isMobile;
  // The card scrolls on desktop; on phones it only scrolls sideways and the page above it scrolls the rows.
  const getScrollElement = useCallback(
    () =>
      isMobile
        ? findNearestScrollContainer(scrollerRef.current)
        : scrollerRef.current,
    [isMobile]
  );

  const query = useDeferredValue(search.trim().toLowerCase());
  // Read through t, so a section's name follows the UI language and the admin's own edits.
  const sectionLabels = useMemo(
    () =>
      Object.fromEntries(
        NAMESPACES.map((name) => [name, t(sectionLabelKey(name))])
      ) as SectionLabels,
    [t]
  );
  const { rows, orphans } = useMemo(() => {
    const built = buildRows(state.overrides);
    return { ...built, rows: sortBySection(built.rows, sectionLabels) };
  }, [state.overrides, sectionLabels]);
  const sectionOptions = useMemo(
    () =>
      [...NAMESPACES]
        .sort((a, b) => sectionLabels[a].localeCompare(sectionLabels[b]))
        .map((name) => ({ value: name, label: sectionLabels[name] })),
    [sectionLabels]
  );
  const editedCount = useMemo(() => rows.filter(isEdited).length, [rows]);
  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          (tab === 'all' || isEdited(row)) &&
          (namespace === ALL_NAMESPACES || row.namespace === namespace) &&
          matchesQuery(row, query)
      ),
    [rows, tab, namespace, query]
  );
  const editing = rows.find((row) => row.id === editingId) ?? null;
  const ready = !state.isLoading && !state.error;
  const filtered = query !== '' || namespace !== ALL_NAMESPACES;

  const open = useCallback((row: TranslationRow) => setEditingId(row.id), []);

  const save = async (values: Partial<Record<Language, string>>) => {
    if (!editing) return;
    setIsSaving(true);
    const saved = await onSave(editing, values);
    setIsSaving(false);
    if (saved) setEditingId(null);
  };

  const removeOrphans = async () => {
    setIsRemovingOrphans(true);
    await onRemoveOrphans(orphans);
    setIsRemovingOrphans(false);
    setConfirmingOrphans(false);
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-1 px-4 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-7">
        <h1 className="m-0 font-serif text-display font-light leading-tight tracking-tight text-foreground">
          {t('page.title')}
        </h1>
        <p className="num min-h-5 text-sm text-muted-foreground">
          {ready &&
            t('page.summary', { count: rows.length, edited: editedCount })}
        </p>
      </div>

      <PageTabs
        tabs={[
          { key: 'all', label: t('tabs.all'), count: rows.length },
          {
            key: 'edited',
            label: t('tabs.edited'),
            count: ready ? editedCount : undefined
          }
        ]}
        value={tab}
        onChange={setTab}
      />

      {/* As on the applications list: the filters stay put and the table scrolls in its own frame; phones scroll the page */}
      <div className="flex flex-col gap-4 px-4 pt-4 pb-20 sm:px-7 md:min-h-0 md:flex-1 md:pb-7">
        <div className="flex flex-wrap items-center gap-3">
          <InputGroup className="w-full sm:w-72">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t('page.searchLabel')}
              placeholder={t('page.searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
            />
          </InputGroup>
          <label htmlFor={NAMESPACE_SELECT_ID} className="sr-only">
            {t('page.namespaceLabel')}
          </label>
          <SelectField
            id={NAMESPACE_SELECT_ID}
            className="w-full sm:w-72"
            value={namespace}
            onChange={setNamespace}
            options={[
              { value: ALL_NAMESPACES, label: t('page.allNamespaces') },
              ...sectionOptions
            ]}
          />
          {ready && filtered && (
            <span
              className="num text-sm text-muted-foreground"
              aria-live="polite"
            >
              {t('page.matches', {
                shown: visible.length,
                count: tab === 'all' ? rows.length : editedCount
              })}
            </span>
          )}
        </div>

        {ready && orphans.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warm-line bg-clay-soft px-5 py-3 text-sm text-clay-ink">
            <span>{t('orphans.notice', { count: orphans.length })}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmingOrphans(true)}
            >
              {t('orphans.remove')}
            </Button>
          </div>
        )}

        {/* The box the page gives the table, which the launcher clearance is measured against */}
        <div className="flex flex-col md:min-h-0 md:flex-1">
          <div
            ref={scrollerRef}
            className={cn(
              'overflow-x-auto rounded-xl border border-warm-line bg-card md:min-h-0 md:overflow-y-auto',
              needsClearance && 'pb-12'
            )}
          >
            <div ref={contentRef}>
              {state.error ? (
                <p className="px-5 py-4 text-sm text-destructive">
                  {state.error}
                </p>
              ) : state.isLoading ? (
                <TranslationsTableSkeleton />
              ) : (
                <TranslationsTable
                  rows={visible}
                  sectionLabels={sectionLabels}
                  emptyMessage={t(
                    tab === 'edited' && !filtered
                      ? 'list.emptyEdited'
                      : 'list.empty'
                  )}
                  keepLastRule={needsClearance}
                  getScrollElement={getScrollElement}
                  onOpen={open}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <TranslationEditDialog
          key={editing.id}
          row={editing}
          sectionLabel={sectionLabels[editing.namespace]}
          isSaving={isSaving}
          onSave={(values) => void save(values)}
          onCancel={() => setEditingId(null)}
        />
      )}

      <Modal
        open={confirmingOrphans}
        title={t('orphans.confirmTitle')}
        description={t('orphans.confirmDescription')}
        cancelLabel={t('edit.cancel')}
        confirmLabel={t('orphans.remove')}
        tone="danger"
        confirmPending={isRemovingOrphans}
        onConfirm={() => void removeOrphans()}
        onCancel={() => setConfirmingOrphans(false)}
      />
    </main>
  );
}

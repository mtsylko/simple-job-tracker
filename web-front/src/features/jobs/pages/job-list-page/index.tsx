import { useCallback, useDeferredValue, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useReactTable,
  type ExpandedState,
  type GroupingState,
  type RowSelectionState
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/app/routes';
import { isArchived, type JobRow } from '@/features/jobs/types';
import { exportApplicationsCSV } from '@/features/jobs/export-applications-csv';
import { trackApplicationsExported } from '@/lib/analytics-events';

import { Modal } from '@/components/Modal';
import { EmptyState } from '@/features/jobs/components/empty-state';
import { BlacklistDialog } from '@/features/companies/components/BlacklistDialog';
import { useCompanyBlacklisting } from '@/features/companies/use-company-blacklisting';
import { useCvVersionsLoadState } from '@/features/cv-versions/use-cv-versions-load-state';

import { BulkActionBar } from './BulkActionBar';
import { Header } from './Header';
import { JobsTable } from './JobsTable';
import { JobsCardList } from './JobsCardList';
import { ListToolbar } from './ListToolbar';
import { StatusTabs } from './StatusTabs';
import { useBulkArchiving } from './use-bulk-archiving';
import { useJobArchiving } from './use-job-archiving';
import { useJobTableLayout } from './use-job-table-layout';
import { useJobDeletion } from './use-job-deletion';
import { useJobStatusOptions } from '@/features/jobs/use-job-status-options';
import { useJobListColumns } from './use-job-list-columns';
import {
  useFilteredJobs,
  useJobFilterOptions,
  useScopedJobs,
  useTabCounts
} from './use-job-list-filters';
import { useJobListUrlFilters } from './use-job-list-url-filters';
import { useSortedJobs } from './use-sorted-jobs';
import { ALL_TAB } from './use-job-list-filters';
import { Filters } from './Filters.tsx';

export function JobListPage({
  jobs,
  onEdit,
  onSetArchived,
  onSetManyArchived,
  onDelete
}: {
  jobs: JobRow[];
  onEdit: (id: string) => void;
  onSetArchived: (id: string, archived: boolean) => Promise<void>;
  onSetManyArchived: (ids: string[], archived: boolean) => Promise<number>;
  onDelete: (id: string) => Promise<void>;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('jobs');

  // Filters and sort live in the URL so they outlive the round trip through the
  // job form and survive a reload.
  const {
    filterValues,
    setFilter,
    clearFilters,
    activeTab,
    setActiveTab,
    sorting,
    setSorting
  } = useJobListUrlFilters();

  const {
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
    resetLayout,
    hiddenColumnCount
  } = useJobTableLayout();

  const {
    deletingJobId,
    jobPendingDeletion,
    requestDelete,
    cancelDelete,
    confirmDelete
  } = useJobDeletion(onDelete);
  const { archivingJobId, toggleArchive } = useJobArchiving(onSetArchived);
  const { isBulkArchiving, setManyArchived } =
    useBulkArchiving(onSetManyArchived);
  const {
    companyPendingBlacklist,
    isBlacklisting,
    requestBlacklist,
    cancelBlacklist,
    confirmBlacklist
  } = useCompanyBlacklisting();
  const requestRowBlacklist = useCallback(
    (row: JobRow) => requestBlacklist(row.company),
    [requestBlacklist]
  );

  const {
    roleOptions,
    typeOptions,
    employmentTypeOptions,
    contractTypeOptions,
    levelOptions,
    outcomeOptions,
    scopeOptions
  } = useJobFilterOptions(jobs);

  // Tabs are the statuses flagged `showAsTab`, in sort order. A URL tab that is
  // no longer a tab status (renamed, un-flagged) falls back to `all`.
  const { statusOptions } = useJobStatusOptions();
  const tabStatuses = statusOptions
    .filter((option) => option.showAsTab)
    .map((option) => option.value);
  const effectiveTab =
    activeTab === ALL_TAB || tabStatuses.includes(activeTab)
      ? activeTab
      : ALL_TAB;

  // Switching tabs re-filters and rebuilds the whole table in one commit, which
  // otherwise blocks the tab strip from painting its new active state. Deferring
  // the value the list is built from lets the highlight move immediately while
  // the heavier table update lands in a follow-up render.
  const deferredTab = useDeferredValue(effectiveTab);

  // Same reason for the filter bar: the company search updates its value every
  // keystroke, and refiltering plus the table rebuild would block the input
  // (worst on held Backspace). The bar keeps the immediate `filterValues` so the
  // field stays responsive; only the list is built from the deferred copy.
  const deferredFilterValues = useDeferredValue(filterValues);

  // Scope comes first: the tabs and their counts describe the scoped set, not
  // the whole store.
  const scopedJobs = useScopedJobs(jobs, filterValues.scope);
  const filteredJobs = useFilteredJobs(
    scopedJobs,
    deferredTab,
    deferredFilterValues
  );
  const tabCounts = useTabCounts(scopedJobs, tabStatuses);

  const sortedJobs = useSortedJobs(filteredJobs, sorting, statusOptions);

  const handleExport = useCallback(() => {
    exportApplicationsCSV(sortedJobs, t);
    trackApplicationsExported(sortedJobs.length);
  }, [sortedJobs, t]);

  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // A new tab or filter starts a new selection, so an action never reaches rows out of view
  const viewKey = JSON.stringify([effectiveTab, filterValues]);
  const [selectionViewKey, setSelectionViewKey] = useState(viewKey);
  if (selectionViewKey !== viewKey) {
    setSelectionViewKey(viewKey);
    setRowSelection({});
  }

  // Loads CV versions for the CV column, which reads them per cell.
  useCvVersionsLoadState();

  const columns = useJobListColumns({
    busyJobId: deletingJobId ?? archivingJobId,
    showArchivedMarker: filterValues.scope === 'all',
    onEditJob: onEdit,
    onToggleArchiveJob: toggleArchive,
    onBlacklistCompany: requestRowBlacklist,
    onDeleteJob: requestDelete
  });

  const table = useReactTable({
    data: sortedJobs,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    // Rows arrive already sorted, so the table only tracks which header is
    // active rather than ordering anything itself.
    manualSorting: true,
    enableMultiSort: false,
    // Keep an active sort always: a header click flips asc<->desc rather than
    // cycling through a removed state, which read as "the direction won't change".
    enableSortingRemoval: false,
    // Grouping must not also hide the column it grouped by: the company header
    // is what labels each group.
    groupedColumnMode: false,
    columnResizeMode: 'onChange',
    enableRowSelection: (row) => !row.getIsGrouped(),
    state: {
      sorting,
      columnVisibility,
      columnSizing,
      grouping,
      expanded,
      rowSelection
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded
  });

  const hasJobs = jobs.length > 0;

  // Built from the rows in the table, so ids left over from an archived row drop out
  const selectedJobs = table
    .getSelectedRowModel()
    .flatRows.map((row) => row.original);
  const archivableIds = selectedJobs
    .filter((job) => !isArchived(job))
    .map((job) => job.id);
  const restorableIds = selectedJobs
    .filter((job) => isArchived(job))
    .map((job) => job.id);

  const handleBulkArchive = (ids: string[], archived: boolean) => {
    void setManyArchived(ids, archived).then((done) => {
      if (done) setRowSelection({});
    });
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <Header onExport={handleExport} />

      <StatusTabs
        activeTab={effectiveTab}
        tabStatuses={tabStatuses}
        counts={tabCounts}
        onChange={setActiveTab}
      />

      {!hasJobs && <EmptyState onAdd={() => navigate(ROUTES.jobsCreate)} />}

      {hasJobs && (
        <>
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-7 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4">
              <Filters
                values={filterValues}
                onChange={setFilter}
                onClearAll={clearFilters}
                roleOptions={roleOptions}
                typeOptions={typeOptions}
                employmentTypeOptions={employmentTypeOptions}
                contractTypeOptions={contractTypeOptions}
                levelOptions={levelOptions}
                outcomeOptions={outcomeOptions}
              />

              <ListToolbar
                table={table}
                hiddenColumnCount={hiddenColumnCount}
                onResetColumns={resetLayout}
                filteredCount={filteredJobs.length}
                totalCount={scopedJobs.length}
                scope={filterValues.scope}
                scopeOptions={scopeOptions}
                onScopeChange={(scope) => setFilter('scope', scope)}
              />
            </div>

            <div className="relative hidden min-h-0 flex-1 md:flex md:flex-col">
              <JobsTable table={table} hasActionBar={selectedJobs.length > 0} />

              {selectedJobs.length > 0 && (
                <BulkActionBar
                  selectedCount={selectedJobs.length}
                  archivableCount={archivableIds.length}
                  restorableCount={restorableIds.length}
                  isPending={isBulkArchiving}
                  onArchive={() => handleBulkArchive(archivableIds, true)}
                  onRestore={() => handleBulkArchive(restorableIds, false)}
                  onClear={() => setRowSelection({})}
                />
              )}
            </div>

            {/* Cards overflow the padded box above, so the launcher clearance goes here (mb-4 + pb-16) */}
            <div className="pb-16 md:hidden">
              <JobsCardList
                jobs={sortedJobs}
                showArchivedMarker={filterValues.scope === 'all'}
                busyJobId={deletingJobId ?? archivingJobId}
                onEdit={onEdit}
                onToggleArchive={toggleArchive}
                onBlacklistCompany={requestRowBlacklist}
                onDelete={requestDelete}
              />
            </div>
          </div>
        </>
      )}

      <Modal
        open={jobPendingDeletion !== null}
        tone="danger"
        title={t('list.deleteDialog.title', {
          company:
            jobPendingDeletion?.company.trim() || t('list.table.noCompany')
        })}
        description={t('list.deleteDialog.body')}
        confirmLabel={t('list.deleteDialog.confirm')}
        cancelLabel={t('list.deleteDialog.cancel')}
        confirmPending={deletingJobId !== null}
        onConfirm={() => void confirmDelete()}
        onCancel={cancelDelete}
      />

      <BlacklistDialog
        company={companyPendingBlacklist}
        isPending={isBlacklisting}
        onConfirm={(reason) => void confirmBlacklist(reason)}
        onCancel={cancelBlacklist}
      />
    </main>
  );
}

import { useMemo, type ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { formatDisplayDate } from '@/lib/format-date';
import type { JobRow } from '@/features/jobs/types';
import { DateCell } from './TableCells/DateCell.tsx';
import { StatusBadge } from './TableCells/StatusBadge.tsx';
import { OutcomeCell } from './TableCells/OutcomeCell.tsx';
import { JobPostLinkCell } from './TableCells/JobPostLinkCell.tsx';
import { TypeBadge } from './TableCells/TypeBadge.tsx';
import { SalaryCell } from './TableCells/SalaryCell.tsx';
import { TextCell } from './TableCells/TextCell.tsx';
import { CompanyCell } from './TableCells/CompanyCell.tsx';
import { CvCell } from './TableCells/CvCell.tsx';
import { JobOpenLink } from './TableCells/JobOpenLink.tsx';
import { RowMenu } from './TableCells/RowMenu.tsx';
import { SelectCheckbox } from './TableCells/SelectCheckbox.tsx';
import {
  SELECT_COLUMN_ID,
  SELECT_COLUMN_WIDTH
} from './JobsTable/column-pinning';
import type { HideableJobColumnId } from './use-job-table-layout';

type UseJobListColumnsArgs = {
  /** Row with a delete or archive request in flight; its menu is disabled. */
  busyJobId: string | null;
  showArchivedMarker: boolean;
  onEditJob: (id: string) => void;
  onToggleArchiveJob: (row: JobRow) => void;
  onBlacklistCompany: (row: JobRow) => void;
  onDeleteJob: (row: JobRow) => void;
};

/** A data column: fixed widths and a cell that only ever sees a real job row. */
type JobColumnSpec = {
  key: HideableJobColumnId;
  labelKey: string;
  minWidth: number;
  width: number;
  /**
   * Offered in the "Group by" picker. Off for anything whose values are close
   * to unique per row — dates, salaries, links, free text — where every group
   * would hold exactly one application.
   */
  groupable?: boolean;
  /** First header click sorts descending, where TanStack would pick ascending for a string. */
  sortDescFirst?: boolean;
  renderCell: (row: JobRow) => ReactNode;
};

export function useJobListColumns({
  busyJobId,
  showArchivedMarker,
  onEditJob,
  onToggleArchiveJob,
  onBlacklistCompany,
  onDeleteJob
}: UseJobListColumnsArgs) {
  const { t } = useTranslation('jobs');

  return useMemo(() => {
    const dataColumns: JobColumnSpec[] = [
      {
        key: 'appliedAt',
        labelKey: 'applied',
        minWidth: 130,
        width: 140,
        renderCell: (row) => (
          <DateCell value={formatDisplayDate(row.appliedAt)} />
        )
      },
      {
        key: 'status',
        groupable: true,
        sortDescFirst: true,
        labelKey: 'status',
        minWidth: 130,
        width: 140,
        renderCell: (row) => (
          <StatusBadge status={row.status} color={row.statusColor} />
        )
      },
      {
        key: 'statusChangedAt',
        labelKey: 'statusChanged',
        minWidth: 150,
        width: 160,
        renderCell: (row) => (
          <DateCell value={formatDisplayDate(row.statusChangedAt)} />
        )
      },
      {
        key: 'outcome',
        groupable: true,
        labelKey: 'outcome',
        minWidth: 190,
        width: 220,
        renderCell: (row) => <OutcomeCell outcome={row.outcome} />
      },
      {
        key: 'jobPostLink',
        labelKey: 'post',
        minWidth: 90,
        width: 100,
        renderCell: (row) => <JobPostLinkCell href={row.jobPostLink} />
      },
      {
        key: 'role',
        groupable: true,
        labelKey: 'role',
        minWidth: 130,
        width: 140,
        renderCell: (row) => row.role
      },
      {
        key: 'level',
        groupable: true,
        labelKey: 'level',
        minWidth: 120,
        width: 130,
        renderCell: (row) => (
          <span className="text-foreground/80">{row.level}</span>
        )
      },
      {
        key: 'type',
        groupable: true,
        labelKey: 'type',
        minWidth: 110,
        width: 120,
        renderCell: (row) => <TypeBadge value={row.type} />
      },
      {
        key: 'employmentType',
        groupable: true,
        labelKey: 'employmentType',
        minWidth: 130,
        width: 140,
        renderCell: (row) => (
          <span className="text-foreground/80">{row.employmentType}</span>
        )
      },
      {
        key: 'contractType',
        groupable: true,
        labelKey: 'contractType',
        minWidth: 150,
        width: 170,
        renderCell: (row) => (
          <span className="text-foreground/80">{row.contractType}</span>
        )
      },
      {
        key: 'salaryRange',
        labelKey: 'salary',
        minWidth: 170,
        width: 190,
        renderCell: (row) => <SalaryCell row={row} />
      },
      {
        key: 'cv',
        groupable: true,
        labelKey: 'cv',
        minWidth: 150,
        width: 160,
        renderCell: (row) => <CvCell name={row.cv} />
      },
      {
        key: 'notes',
        labelKey: 'notes',
        minWidth: 240,
        width: 300,
        renderCell: (row) => <TextCell value={row.notes} />
      },
      {
        key: 'applicationQuestions',
        labelKey: 'applicationQuestions',
        minWidth: 260,
        width: 320,
        renderCell: (row) => <TextCell value={row.applicationQuestions} />
      }
    ];

    return [
      {
        id: SELECT_COLUMN_ID,
        header: ({ table }) => (
          <SelectCheckbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            label={t('list.bulk.selectAll')}
            onCheckedChange={(checked) => table.toggleAllRowsSelected(checked)}
          />
        ),
        minSize: SELECT_COLUMN_WIDTH,
        size: SELECT_COLUMN_WIDTH,
        maxSize: SELECT_COLUMN_WIDTH,
        enableSorting: false,
        enableResizing: false,
        enableHiding: false,
        enableGrouping: false,
        cell: ({ row }) => (
          <SelectCheckbox
            checked={row.getIsSelected()}
            label={t('list.bulk.selectRow', {
              company: row.original.company.trim() || t('list.table.noCompany')
            })}
            onCheckedChange={(checked) => row.toggleSelected(checked)}
          />
        )
      },
      {
        accessorKey: 'company',
        header: t('list.table.columns.company'),
        minSize: 240,
        size: 280,
        enableHiding: false,
        cell: ({ row }) => {
          // Under a company group the company is redundant — the header carries
          // it — so the role stands in as the row's title. Grouped by anything
          // else the company is still the row's identity and stays put. A
          // company with a single application is rendered in place of its own
          // group header (see JobsTable), so it keeps the full cell too.
          const parentRow = row.getParentRow();
          const insideCompanyGroup =
            parentRow?.groupingColumnId === 'company' &&
            parentRow.subRows.length > 1;

          if (insideCompanyGroup) {
            return (
              <div className="flex h-full min-w-0 items-center pl-14">
                <JobOpenLink
                  id={row.original.id}
                  className="truncate text-sm text-foreground"
                >
                  {row.original.role}
                </JobOpenLink>
              </div>
            );
          }

          return (
            <CompanyCell
              row={row.original}
              showArchivedMarker={showArchivedMarker}
            />
          );
        }
      },
      // Sits second, pinned beside the company name rather than out at the far
      // right, which is where react-data-grid rendered it.
      {
        id: 'actions',
        header: '',
        minSize: 64,
        size: 64,
        maxSize: 64,
        enableSorting: false,
        enableResizing: false,
        enableHiding: false,
        enableGrouping: false,
        cell: ({ row }) => (
          <RowMenu
            row={row.original}
            disabled={busyJobId === row.original.id}
            onEdit={onEditJob}
            onToggleArchive={onToggleArchiveJob}
            onBlacklistCompany={onBlacklistCompany}
            onDelete={onDeleteJob}
          />
        )
      },
      // On a group row every one of these is blanked by the renderer, which
      // draws the header in the first column instead — see JobsTableRow.
      ...dataColumns.map(
        ({
          key,
          labelKey,
          minWidth,
          width,
          groupable,
          sortDescFirst,
          renderCell
        }): ColumnDef<JobRow> => ({
          accessorKey: key,
          header: t(`list.table.columns.${labelKey}`),
          minSize: minWidth,
          size: width,
          enableGrouping: groupable === true,
          sortDescFirst,
          cell: ({ row }) => renderCell(row.original)
        })
      )
    ] satisfies ColumnDef<JobRow>[];
  }, [
    busyJobId,
    onToggleArchiveJob,
    onBlacklistCompany,
    onDeleteJob,
    onEditJob,
    showArchivedMarker,
    t
  ]);
}

import { Trans, useTranslation } from 'react-i18next';
import type { Table } from '@tanstack/react-table';

import {
  SelectField,
  type SelectFieldOption
} from '@/components/ui/select-field';
import type { JobRow, JobScope } from '@/features/jobs/types';

import { ColumnPicker } from './ColumnPicker';
import { GroupByPicker } from './GroupByPicker';

interface ListToolbarProps {
  table: Table<JobRow>;
  hiddenColumnCount: number;
  onResetColumns: () => void;
  filteredCount: number;
  totalCount: number;
  scope: JobScope;
  scopeOptions: SelectFieldOption[];
  onScopeChange: (scope: JobScope) => void;
}

export const ListToolbar = ({
  table,
  hiddenColumnCount,
  onResetColumns,
  filteredCount,
  totalCount,
  scope,
  scopeOptions,
  onScopeChange
}: ListToolbarProps) => {
  const { t } = useTranslation('jobs');

  // Wraps rather than clips: with scope on the row, the cluster is wider than a phone.
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {/* Scope belongs with the view controls rather than the filters: it picks
          which records exist before the tabs count them, and the count at the
          end of this row is reporting the result. A fixed width keeps the
          buttons beside it still as the label changes. */}
      <label htmlFor="job-list-scope" className="sr-only">
        {t('list.filters.scopeLabel')}
      </label>
      <SelectField
        id="job-list-scope"
        className="w-40"
        options={scopeOptions}
        value={scope}
        onChange={(value) => onScopeChange(value as JobScope)}
      />

      {/* Table-only controls, hidden on the phone card list. */}
      <div className="hidden md:contents">
        <GroupByPicker table={table} />

        <ColumnPicker
          table={table}
          hiddenColumnCount={hiddenColumnCount}
          onReset={onResetColumns}
        />
      </div>

      {/* How many rows the filters match, not how many are rendered — that is
          the batch count at the foot of the table. Always "X of N", including
          when they are equal: a phrase that changed shape with the tab dragged
          the buttons beside it sideways.

          The matched number is padded to the width of the total it cannot
          exceed. `.num` is tabular, so a digit is exactly 1ch and the whole
          line holds its width as the count changes. */}
      <div className="text-sm text-muted-foreground">
        <Trans
          t={t}
          i18nKey="list.filters.matchingCount"
          values={{ filtered: filteredCount, total: totalCount }}
          components={{
            filtered: (
              <span
                className="num inline-block text-right font-medium text-foreground"
                style={{ minWidth: `${String(totalCount).length}ch` }}
              />
            ),
            total: <span className="num" />
          }}
        />
      </div>
    </div>
  );
};

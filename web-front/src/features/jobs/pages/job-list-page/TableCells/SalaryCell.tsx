import type { JobRow } from '@/features/jobs/types.ts';
import { useTranslation } from 'react-i18next';

export function SalaryCell({ row }: { row: JobRow }) {
  const { t } = useTranslation('jobs');
  const range = row.salaryRange.trim();
  const ask = row.salaryExpectations.trim();
  return (
    <div className="leading-tight">
      <div className="text-foreground">
        {range.length > 0 ? (
          range
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
      {ask.length > 0 ? (
        <div className="num mt-0.5 text-xs text-muted-foreground">
          {t('list.table.askPrefix', { value: ask })}
        </div>
      ) : null}
    </div>
  );
}

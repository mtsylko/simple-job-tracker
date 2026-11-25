import { useTranslation } from 'react-i18next';
import type { CompanySummary } from '@job-tracker/shared';

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { BlacklistAddForm } from '@/features/companies/components/BlacklistAddForm';
import { BlacklistRow } from '@/features/companies/components/BlacklistRow';

export function BlacklistPanel({
  companies,
  candidates,
  emptyMessage,
  isAdding,
  onAddClose,
  onAdd,
  onEditReason,
  onRemove
}: {
  companies: CompanySummary[];
  /** Companies the add form can pick from: the user's own, not yet blacklisted. */
  candidates: string[];
  emptyMessage: string;
  // Opened from the page's header button.
  isAdding: boolean;
  onAddClose: () => void;
  onAdd: (company: string, reason: string | null) => Promise<void>;
  onEditReason: (company: CompanySummary) => void;
  onRemove: (company: CompanySummary) => void;
}) {
  const { t } = useTranslation('companies');

  return (
    <>
      {isAdding && (
        <div className="border-b border-warm-line bg-warm-surface-2">
          <div className="max-w-xl">
            <BlacklistAddForm
              companies={candidates}
              onSubmit={async (company, reason) => {
                await onAdd(company, reason);
                onAddClose();
              }}
              onCancel={onAddClose}
            />
          </div>
        </div>
      )}
      {companies.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <Table className="table-fixed">
          <TableHeader className="bg-transparent">
            <TableRow className="border-warm-line hover:bg-transparent">
              <TableHead className="pl-5 sm:w-[280px]">
                {t('list.company')}
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                {t('blacklisted.reason')}
              </TableHead>
              <TableHead className="hidden w-32 lg:table-cell">
                {t('blacklisted.date')}
              </TableHead>
              <TableHead className="w-14 pr-3">
                <span className="sr-only">{t('list.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <BlacklistRow
                key={company.id}
                company={company}
                onEditReason={onEditReason}
                onRemove={onRemove}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

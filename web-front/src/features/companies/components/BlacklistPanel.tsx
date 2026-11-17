import { useState } from 'react';
import { Plus } from 'lucide-react';
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
  emptyMessage,
  onAdd,
  onEditReason,
  onRemove
}: {
  companies: CompanySummary[];
  emptyMessage: string;
  onAdd: (company: string, reason: string | null) => Promise<void>;
  onEditReason: (company: CompanySummary) => void;
  onRemove: (company: CompanySummary) => void;
}) {
  const { t } = useTranslation('companies');
  const [isAdding, setIsAdding] = useState(false);

  return (
    <>
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
              <TableHead className="w-24 pr-3">
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

      <div className="border-t border-warm-line bg-warm-surface-2">
        {isAdding ? (
          <div className="max-w-xl">
            <BlacklistAddForm
              onSubmit={async (company, reason) => {
                await onAdd(company, reason);
                setIsAdding(false);
              }}
              onCancel={() => setIsAdding(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center gap-2.5 px-5 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {t('form.addTitle')}
          </button>
        )}
      </div>
    </>
  );
}

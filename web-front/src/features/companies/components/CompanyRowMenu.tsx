import { Ban, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CompanySummary } from '@job-tracker/shared';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { canDelete } from '@/features/companies/company-paths';

/** One menu per row, as in the applications table; the items follow the company's blacklist state. */
export function CompanyRowMenu({
  company,
  onToggleBlacklist,
  onEditReason,
  onDelete
}: {
  company: CompanySummary;
  onToggleBlacklist: (company: CompanySummary) => void;
  /** Offered only for a company added by hand and never applied to. */
  onDelete: (company: CompanySummary) => void;
  /** Shown for a blacklisted company when given, on the Blacklisted tab. */
  onEditReason?: (company: CompanySummary) => void;
}) {
  const { t } = useTranslation('companies');
  const blacklisted = company.blacklist !== null;

  return (
    <div className="flex h-full items-center justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          // Borderless at rest, as in the applications table
          className="border-transparent text-muted-foreground hover:text-foreground dark:bg-transparent"
          aria-label={t('list.menu.actions', { name: company.name })}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 32px to click, as the other row controls; the primitive defaults to 24 */}
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {blacklisted && onEditReason && (
            <DropdownMenuItem
              className="gap-2"
              onClick={() => onEditReason(company)}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              {t('blacklisted.editReason')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="gap-2"
            onClick={() => onToggleBlacklist(company)}
          >
            <Ban className="size-3.5" aria-hidden="true" />
            {t(blacklisted ? 'list.unblacklistAction' : 'list.blacklistAction')}
          </DropdownMenuItem>
          {canDelete(company) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive"
                onClick={() => onDelete(company)}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                {t('list.deleteAction')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

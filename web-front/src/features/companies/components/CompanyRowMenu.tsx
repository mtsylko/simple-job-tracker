import { Ban, MoreHorizontal, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CompanySummary } from '@job-tracker/shared';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

/** One menu per row, as in the applications table; the items follow the company's blacklist state. */
export function CompanyRowMenu({
  company,
  onToggleBlacklist,
  onEditReason
}: {
  company: CompanySummary;
  onToggleBlacklist: (company: CompanySummary) => void;
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

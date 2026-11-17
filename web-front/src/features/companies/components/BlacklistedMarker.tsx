import { useTranslation } from 'react-i18next';
import type { CompanyBlacklist } from '@job-tracker/shared';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

/** The red dot and word a blacklisted company carries wherever it is listed, reason in the tooltip. */
export function BlacklistedMarker({
  blacklist
}: {
  blacklist: CompanyBlacklist;
}) {
  const { t } = useTranslation('companies');

  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex shrink-0 items-center gap-1.5 font-medium whitespace-nowrap text-danger-ink">
        <span
          className="size-1.5 shrink-0 rounded-full bg-danger-ink"
          aria-hidden="true"
        />
        {t('marker.label')}
      </TooltipTrigger>
      <TooltipContent>
        {blacklist.reason?.trim()
          ? t('marker.reason', { reason: blacklist.reason })
          : t('marker.hint')}
      </TooltipContent>
    </Tooltip>
  );
}

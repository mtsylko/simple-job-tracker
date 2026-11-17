import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { exitAccount } from '@/features/admin-users/view-account';
import { getViewAs } from '@/lib/view-as';

/** Says whose account the page shows while an admin views one, and leads back out. */
export function ViewAsBanner() {
  const { t } = useTranslation('adminUsers');
  const target = getViewAs();

  if (!target) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex shrink-0 items-center gap-3 border-b border-warm-line bg-clay-soft px-4 py-2 text-sm text-clay-ink sm:px-7"
    >
      <Eye className="size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 truncate">
        {t('viewAs.banner', { name: target.displayName ?? target.email })}
      </p>
      {/* The outline border all but matches clay-soft, so the fill is what makes it read as a button */}
      <Button
        variant="outline"
        size="sm"
        className="bg-background"
        onClick={() => void exitAccount()}
      >
        {t('viewAs.exit')}
      </Button>
    </div>
  );
}

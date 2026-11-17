import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

export const EmptyResult = ({ className }: { className?: string }) => {
  const { t } = useTranslation('jobs');

  return (
    // Sticky so the message stays in view when the header above it is scrolled
    // sideways.
    <div className={cn('sticky left-0 p-10 text-center', className)}>
      <div className="font-serif text-xl font-normal text-foreground">
        {t('list.table.noMatch')}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">
        {t('list.table.noMatchHint')}
      </div>
    </div>
  );
};

import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { getViewAs } from '@/lib/view-as';
import { cn } from '@/lib/utils';

import { FeedbackDialog } from './FeedbackDialog';

/** Placed by the caller over the content's corner; pages end with `pb-20` (the jobs and translations tables pad their own scrollers) so their last row scrolls clear of it. */
export function FeedbackLauncher({
  email,
  className
}: {
  email: string;
  className?: string;
}) {
  const { t } = useTranslation('feedback');
  const [isOpen, setIsOpen] = useState(false);

  // A viewed account is read-only, so it cannot send feedback.
  if (getViewAs() !== null) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-label={t('launcher.label')}
        onClick={() => setIsOpen(true)}
        className={cn(
          'h-10 gap-2 rounded-full bg-card px-3 text-sm text-foreground shadow-popover hover:bg-muted sm:px-4 dark:bg-card dark:hover:bg-muted',
          className
        )}
      >
        <MessageSquareText className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t('launcher.label')}</span>
      </Button>

      <FeedbackDialog
        open={isOpen}
        email={email}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

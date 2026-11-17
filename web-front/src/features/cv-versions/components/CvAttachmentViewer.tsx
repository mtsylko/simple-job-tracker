import { Dialog } from '@base-ui/react/dialog';
import { Download, ExternalLink, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  attachmentLabel,
  downloadAttachment
} from '@/features/cv-versions/attachment';
import { notify } from '@/lib/notifications';

/** Reads the attached PDF in place, using the browser's own PDF viewer. */
export function CvAttachmentViewer({
  attachment,
  title,
  open,
  onOpenChange
}: {
  attachment: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('cvVersions');
  const url = attachment.trim();
  const fileName = attachmentLabel(url);

  async function handleDownload() {
    try {
      await downloadAttachment(url, fileName);
    } catch (error) {
      notify.error(
        t('viewer.downloadFailed'),
        error instanceof Error ? error.message : undefined
      );
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/80 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex h-[92vh] w-[94vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-warm-line bg-card shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0">
          <div className="flex items-center gap-3 border-b border-warm-line px-5 py-3">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="truncate font-serif text-base font-medium tracking-tight text-foreground">
                {title}
              </Dialog.Title>
              {fileName.length > 0 && (
                <Dialog.Description className="truncate font-mono text-xs text-ink-3">
                  {fileName}
                </Dialog.Description>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                nativeButton={false}
                render={<a href={url} target="_blank" rel="noreferrer" />}
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
                {t('viewer.openInNewTab')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => void handleDownload()}
              >
                <Download className="size-3.5" aria-hidden="true" />
                {t('viewer.download')}
              </Button>
              <Dialog.Close render={<Button variant="ghost" size="icon-sm" />}>
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">{t('viewer.close')}</span>
              </Dialog.Close>
            </div>
          </div>

          <iframe
            src={url}
            title={t('viewer.frameTitle', { name: title })}
            className="min-h-0 flex-1 border-0 bg-warm-surface-2"
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

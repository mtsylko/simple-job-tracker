import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CvAttachmentViewer } from '@/features/cv-versions/components/CvAttachmentViewer';
import { useCvAttachment } from '../use-cv-attachment';

/** The CV version this application was sent with, previewable when a PDF is attached. */
export function CvCell({ name }: { name: string }) {
  const { t } = useTranslation('jobs');
  const attachment = useCvAttachment(name);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (attachment.length === 0) {
    return <span className="text-sm text-foreground/80">{trimmed}</span>;
  }

  return (
    <>
      <button
        type="button"
        title={t('list.table.previewCv')}
        className="max-w-full cursor-pointer truncate border-0 bg-transparent p-0 text-sm font-medium text-primary underline decoration-dotted underline-offset-4"
        onClick={(event) => {
          event.stopPropagation();
          setIsPreviewOpen(true);
        }}
      >
        {trimmed}
      </button>
      {isPreviewOpen && (
        <CvAttachmentViewer
          attachment={attachment}
          title={trimmed}
          open
          onOpenChange={setIsPreviewOpen}
        />
      )}
    </>
  );
}

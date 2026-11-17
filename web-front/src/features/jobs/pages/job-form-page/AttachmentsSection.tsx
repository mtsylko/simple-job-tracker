import { useState, type ReactNode } from 'react';
import type { TFunction } from 'i18next';
import { Download, FileText, Paperclip, X } from 'lucide-react';
import {
  JOB_ATTACHMENT_MAX_PER_JOB,
  JOB_ATTACHMENT_MAX_SIZE_MB,
  JOB_ATTACHMENT_TYPES,
  type JobAttachment
} from '@job-tracker/shared';

import { Button } from '@/components/ui/button';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { FileUploadField } from '@/components/ui/file-upload-field';
import { downloadJobAttachment } from '@/features/jobs/job-attachments-api';
import { readErrorMessage } from '@/features/utils';
import i18n from '@/i18n';
import { formatDisplayDateTime } from '@/lib/format-date';
import { notify } from '@/lib/notifications';
import { useFileUploadLabels } from '@/lib/ui-labels';
import { cn } from '@/lib/utils';

import type { JobAttachmentsState } from './use-job-attachments';

const ACCEPT = Object.keys(JOB_ATTACHMENT_TYPES).join(',');
const ACCEPTED_FORMATS_LABEL =
  'PDF, DOC, DOCX, ODT, RTF, TXT, MD, PNG, JPG, WEBP';

function formatSize(bytes: number): string {
  const megabytes = bytes >= 1024 * 1024;
  return new Intl.NumberFormat(i18n.language, {
    style: 'unit',
    unit: megabytes ? 'megabyte' : 'kilobyte',
    maximumFractionDigits: megabytes ? 1 : 0
  }).format(megabytes ? bytes / (1024 * 1024) : Math.max(1, bytes / 1024));
}

function FileRow({
  name,
  meta,
  removed = false,
  children
}: {
  name: string;
  meta: ReactNode;
  removed?: boolean;
  children: ReactNode;
}) {
  return (
    <li
      className={cn(
        'flex min-h-11 items-center gap-2 rounded-md border bg-background px-3 py-1.5',
        removed ? 'border-dashed border-border' : 'border-input'
      )}
    >
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded bg-secondary text-muted-foreground"
        aria-hidden="true"
      >
        <FileText className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-medium',
            removed ? 'text-muted-foreground line-through' : 'text-foreground'
          )}
          title={name}
        >
          {name}
        </p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
      {children}
    </li>
  );
}

export function AttachmentsSection({
  jobId,
  attachments,
  disabled,
  t
}: {
  jobId: string | undefined;
  attachments: JobAttachmentsState;
  disabled: boolean;
  t: TFunction<'jobs'>;
}) {
  const fileUploadLabels = useFileUploadLabels();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { saved, staged, removedIds, keptCount, isLoading, loadError } =
    attachments;
  const isFull = keptCount >= JOB_ATTACHMENT_MAX_PER_JOB;
  // Staged files show even while the saved list is still loading.
  const showList = staged.length > 0 || (!isLoading && saved.length > 0);

  async function handleDownload(attachment: JobAttachment) {
    if (!jobId) return;
    setDownloadingId(attachment.id);
    try {
      await downloadJobAttachment(jobId, attachment);
    } catch (error) {
      notify.error(
        t('form.attachments.downloadFailed', { name: attachment.fileName }),
        readErrorMessage(error)
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <FieldSet>
      <FieldLegend>{t('form.sections.attachments')}</FieldLegend>
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <div className="grid min-w-0 grid-cols-1 gap-1.5">
          <FileUploadField
            id="job-attachment-file"
            value=""
            onValueChange={() => undefined}
            onFileSelect={attachments.stage}
            accept={ACCEPT}
            acceptedFormatsLabel={ACCEPTED_FORMATS_LABEL}
            maxSizeMb={JOB_ATTACHMENT_MAX_SIZE_MB}
            disabled={disabled || isFull}
            uploadLabel={t('form.attachments.add')}
            labels={fileUploadLabels}
          />
          {isFull && (
            <p className="text-xs text-muted-foreground">
              {t('form.attachments.limitReached', {
                limit: JOB_ATTACHMENT_MAX_PER_JOB
              })}
            </p>
          )}
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2">
          {loadError && (
            <p className="text-xs text-destructive" role="alert">
              {t('form.attachments.loadFailed')}
            </p>
          )}
          {!showList ? (
            // Mirrors the drop zone beside it; stacked under it on phones it only repeats the zone.
            <div className="hidden min-h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-transparent bg-secondary/30 px-4 py-5 text-center md:flex">
              <span
                className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"
                aria-hidden="true"
              >
                <Paperclip className="size-4" />
              </span>
              <p className="text-sm font-medium text-foreground">
                {isLoading
                  ? t('form.attachments.loading')
                  : t('form.attachments.emptyTitle')}
              </p>
              {!isLoading && (
                <p className="text-xs text-muted-foreground">
                  {t('form.attachments.emptyHint')}
                </p>
              )}
            </div>
          ) : (
            <ul
              className="grid grid-cols-1 gap-2"
              aria-label={t('form.attachments.list')}
            >
              {saved.map((attachment) => {
                const removed = removedIds.has(attachment.id);
                return (
                  <FileRow
                    key={attachment.id}
                    name={attachment.fileName}
                    removed={removed}
                    meta={
                      removed ? (
                        <span className="text-destructive">
                          {t('form.attachments.removedOnSave')}
                        </span>
                      ) : (
                        `${formatSize(attachment.size)} · ${formatDisplayDateTime(attachment.createdAt)}`
                      )
                    }
                  >
                    {removed ? (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="shrink-0 px-1"
                        onClick={() => attachments.toggleRemoved(attachment.id)}
                        disabled={disabled}
                        aria-label={t('form.attachments.undoRemove', {
                          name: attachment.fileName
                        })}
                      >
                        {t('form.attachments.undo')}
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0"
                          onClick={() => void handleDownload(attachment)}
                          disabled={downloadingId === attachment.id}
                          aria-label={t('form.attachments.download', {
                            name: attachment.fileName
                          })}
                        >
                          <Download className="size-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0"
                          onClick={() =>
                            attachments.toggleRemoved(attachment.id)
                          }
                          disabled={disabled}
                          aria-label={t('form.attachments.remove', {
                            name: attachment.fileName
                          })}
                        >
                          <X className="size-3.5" aria-hidden="true" />
                        </Button>
                      </>
                    )}
                  </FileRow>
                );
              })}
              {staged.map(({ key, file }) => (
                <FileRow
                  key={key}
                  name={file.name}
                  meta={
                    <>
                      {formatSize(file.size)} ·{' '}
                      <span className="text-primary">
                        {t('form.attachments.uploadsOnSave')}
                      </span>
                    </>
                  }
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => attachments.unstage(key)}
                    disabled={disabled}
                    aria-label={t('form.attachments.remove', {
                      name: file.name
                    })}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </Button>
                </FileRow>
              ))}
            </ul>
          )}
        </div>
      </div>
    </FieldSet>
  );
}

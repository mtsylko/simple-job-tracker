import { Download, Eye, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { cvVersionEditPath } from '@/app/routes';
import { Button } from '@/components/ui/button';
import { attachmentLabel } from '@/features/cv-versions/attachment';
import type { CvVersionRow } from '@/features/cv-versions/types';
import {
  ROW_OPEN_CLASS,
  ROW_OPENER,
  ROW_OPENER_CLASS,
  rowOpenHandlers
} from '@/lib/row-open';
import { cn } from '@/lib/utils';

import { CvEnabledSwitch } from './CvEnabledSwitch';

/** The phone view of the CV versions list: one stacked card per version, as the applications list has. */
export function CvVersionsCardList({
  cvVersions,
  deletingId,
  togglingId,
  onPreview,
  onDownload,
  onDelete,
  onToggle
}: {
  cvVersions: CvVersionRow[];
  deletingId: string | null;
  togglingId: string | null;
  onPreview: (id: string) => void;
  onDownload: (attachment: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const { t } = useTranslation('cvVersions');

  if (cvVersions.length === 0) {
    return (
      <p className="py-10 text-center font-serif text-lg text-foreground">
        {t('list.noMatch')}
      </p>
    );
  }

  return (
    // One panel with hairlines, like the table it replaces, not a box per version
    <ul className="divide-y divide-warm-line overflow-hidden rounded-xl border border-warm-line bg-warm-surface">
      {cvVersions.map((cv) => {
        const hasAttachment = cv.attachment.trim().length > 0;
        const hasSource = cv.sourceLink.trim().length > 0;

        return (
          <li key={cv.id} className={cn(!cv.enabled && 'opacity-60')}>
            {/* The name opens the version; a tap anywhere else is forwarded to it, the controls keep their own */}
            <div {...rowOpenHandlers} className={cn('p-3.5', ROW_OPEN_CLASS)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    to={cvVersionEditPath(cv.id)}
                    {...ROW_OPENER}
                    className={cn(
                      'block text-sm font-medium leading-tight text-ink',
                      !cv.enabled && 'line-through decoration-ink-3',
                      ROW_OPENER_CLASS
                    )}
                  >
                    {cv.name}
                  </Link>
                  {hasAttachment && (
                    <span className="mt-0.5 block truncate text-xs text-ink-3">
                      {attachmentLabel(cv.attachment)}
                    </span>
                  )}
                  {cv.description.trim().length > 0 && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-ink-2">
                      {cv.description}
                    </p>
                  )}
                </div>
                <CvEnabledSwitch
                  on={cv.enabled}
                  label={t('list.toggle.label', { name: cv.name })}
                  disabled={togglingId === cv.id}
                  onChange={(next) => onToggle(cv.id, next)}
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div className="text-xs">
                  {hasSource && (
                    <a
                      href={cv.sourceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-ink-2 no-underline transition-colors hover:text-clay"
                    >
                      {t('list.openSource')}
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
                {/* Thumb-sized targets; the negative margin keeps the icons on the text's right edge */}
                <div className="-mr-2 flex items-center">
                  {hasAttachment && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-lg"
                        className="text-muted-foreground"
                        aria-label={t('viewer.preview')}
                        onClick={() => onPreview(cv.id)}
                      >
                        <Eye aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-lg"
                        className="text-muted-foreground"
                        aria-label={t('viewer.download')}
                        onClick={() => onDownload(cv.attachment)}
                      >
                        <Download aria-hidden="true" />
                      </Button>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="text-muted-foreground"
                    aria-label={t('list.deleteLabel', { name: cv.name })}
                    disabled={deletingId === cv.id}
                    onClick={() => onDelete(cv.id)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

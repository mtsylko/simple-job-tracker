import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { cvVersionEditPath } from '@/app/routes';
import { attachmentLabel } from '@/features/cv-versions/attachment';
import type { CvVersionRow } from '@/features/cv-versions/types';
import {
  ROW_OPEN_CLASS,
  ROW_OPENER,
  ROW_OPENER_CLASS,
  rowOpenHandlers
} from '@/lib/row-open';
import { cn } from '@/lib/utils';

import { CvRowMenu } from './CvRowMenu';

/** The phone view of the CV versions list: one stacked card per version, as the applications list has. */
export function CvVersionsCardList({
  cvVersions,
  deletingId,
  togglingId,
  onEdit,
  onPreview,
  onDownload,
  showArchivedMarker,
  onToggleArchive,
  onDelete
}: {
  cvVersions: CvVersionRow[];
  deletingId: string | null;
  togglingId: string | null;
  onEdit: (id: string) => void;
  onPreview: (id: string) => void;
  onDownload: (attachment: string) => void;
  /** On only when the list mixes active and archived versions */
  showArchivedMarker: boolean;
  onToggleArchive: (cv: CvVersionRow) => void;
  onDelete: (id: string) => void;
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
          <li key={cv.id}>
            {/* The name opens the version; a tap anywhere else is forwarded to it, the controls keep their own */}
            <div {...rowOpenHandlers} className={cn('p-3.5', ROW_OPEN_CLASS)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    to={cvVersionEditPath(cv.id)}
                    {...ROW_OPENER}
                    className={cn(
                      'block text-sm font-medium leading-tight text-ink',
                      ROW_OPENER_CLASS
                    )}
                  >
                    {cv.name}
                  </Link>
                  {hasAttachment && (
                    <button
                      type="button"
                      className="mt-0.5 block max-w-full truncate text-left text-xs text-ink-3 hover:text-ink-2 hover:underline"
                      onClick={() => onPreview(cv.id)}
                    >
                      {attachmentLabel(cv.attachment)}
                    </button>
                  )}
                  {showArchivedMarker && !cv.enabled && (
                    <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
                      {t('list.archivedMarker')}
                    </span>
                  )}
                  {cv.description.trim().length > 0 && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-ink-2">
                      {cv.description}
                    </p>
                  )}
                </div>
                {/* Thumb-sized targets; the margins keep the dots on the card's edge */}
                <div className="-my-2.5 -mr-3 shrink-0">
                  <CvRowMenu
                    cv={cv}
                    disabled={deletingId === cv.id || togglingId === cv.id}
                    triggerClassName="size-9"
                    onEdit={onEdit}
                    onPreview={onPreview}
                    onDownload={onDownload}
                    onToggleArchive={onToggleArchive}
                    onDelete={onDelete}
                  />
                </div>
              </div>

              {hasSource && (
                <div className="mt-2 text-xs">
                  <a
                    href={cv.sourceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-ink-2 no-underline transition-colors hover:text-clay"
                  >
                    {t('list.openSource')}
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

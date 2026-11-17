import {
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';

import { LANGUAGES } from '@/app/language';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  RULE_CLASS,
  TranslationsTableRow
} from '@/features/admin-translations/components/TranslationsTableRow';
import type {
  SectionLabels,
  TranslationRow
} from '@/features/admin-translations/translation-catalog';
import { cn } from '@/lib/utils';

const SKELETON_ROWS = 6;

// A row with one line of copy; each row is measured once it renders.
const ESTIMATED_ROW_PX = 56;

// Rows kept past each edge of the viewport, so Tab always has a next row to reach.
const OVERSCAN = 8;

// Phones scroll the card sideways rather than squeeze three text columns; `border-separate` keeps the head's rule painted while it is stuck.
const TABLE_CLASS =
  'w-full min-w-[640px] table-fixed border-separate border-spacing-0 text-sm';

// Sticks to the card's scroller, hence a bare table: the ui Table's wrapper scrolls too and would hold it.
const HEAD_CLASS = cn('sticky top-0 z-10 bg-card', RULE_CLASS);

const CLOSED_LAST_ROW_CLASS = '[&>tr:last-child>td]:border-b-0';

function ColumnHeads() {
  const { t } = useTranslation('adminTranslations');
  const { t: tc } = useTranslation('common');

  return (
    <TableHeader className="bg-transparent">
      <TableRow className="hover:bg-transparent" aria-rowindex={1}>
        <TableHead className={cn(HEAD_CLASS, 'w-[30%] pl-5')}>
          {t('list.key')}
        </TableHead>
        {LANGUAGES.map((language) => (
          <TableHead key={language} className={cn(HEAD_CLASS, 'last:pr-5')}>
            {tc(`language.${language}`)}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

/** Holds the height of the rows scrolled out of view. */
function SpacerRow({ height }: { height: number }) {
  return (
    <tr aria-hidden="true">
      <td colSpan={LANGUAGES.length + 1} className="p-0" style={{ height }} />
    </tr>
  );
}

/** Where the rows start inside the scroller: below the head on desktop, below the whole page top on phones. */
function useScrollMargin(
  bodyRef: RefObject<HTMLTableSectionElement | null>,
  getScrollElement: () => HTMLElement | null,
  hasBody: boolean
): number {
  const [margin, setMargin] = useState(0);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const scroller = getScrollElement();
    if (!body || !scroller) {
      return;
    }

    // Fires once on observe, then whenever the scroller or what sits above the rows changes size.
    const observer = new ResizeObserver(() => {
      setMargin(
        body.getBoundingClientRect().top -
          scroller.getBoundingClientRect().top -
          scroller.clientTop +
          scroller.scrollTop
      );
    });
    observer.observe(scroller);
    if (scroller.firstElementChild) {
      observer.observe(scroller.firstElementChild);
    }
    return () => observer.disconnect();
  }, [bodyRef, getScrollElement, hasBody]);

  return margin;
}

/** The final layout with flat bars, so nothing shifts when the strings land. */
export function TranslationsTableSkeleton() {
  return (
    <table className={TABLE_CLASS} aria-busy="true">
      <ColumnHeads />
      <TableBody className={CLOSED_LAST_ROW_CLASS}>
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <TableRow key={index} className="hover:bg-transparent">
            <TableCell className={cn('py-2.5 pl-5', RULE_CLASS)}>
              <Skeleton className="mb-1.5 h-3 w-16 animate-none" />
              <Skeleton className="h-3 w-36 animate-none" />
            </TableCell>
            {LANGUAGES.map((language) => (
              <TableCell
                key={language}
                className={cn('py-2.5 last:pr-5', RULE_CLASS)}
              >
                <Skeleton className="h-3.5 w-3/4 animate-none" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </table>
  );
}

/** Virtualized, since the catalog runs past a thousand rows; memoized, so keystrokes in the search skip it. */
export const TranslationsTable = memo(function TranslationsTable({
  rows,
  sectionLabels,
  emptyMessage,
  keepLastRule,
  getScrollElement,
  onOpen
}: {
  rows: readonly TranslationRow[];
  sectionLabels: SectionLabels;
  emptyMessage: string;
  /** The frame closes the table, so the last rule stays only above the launcher's room. */
  keepLastRule: boolean;
  /** The element that scrolls the rows: the card on desktop, the page on phones. */
  getScrollElement: () => HTMLElement | null;
  onOpen: (row: TranslationRow) => void;
}) {
  const { t } = useTranslation('adminTranslations');
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const scrollMargin = useScrollMargin(
    bodyRef,
    getScrollElement,
    rows.length > 0
  );
  // Sizes are kept per string, so a new filter reuses the heights already measured.
  const getItemKey = useCallback((index: number) => rows[index].id, [rows]);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement,
    estimateSize: () => ESTIMATED_ROW_PX,
    getItemKey,
    overscan: OVERSCAN,
    scrollMargin
  });

  if (rows.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const items = virtualizer.getVirtualItems();
  const first = items[0];
  const last = items[items.length - 1];
  const paddingTop = first ? first.start - scrollMargin : 0;
  const paddingBottom = last
    ? virtualizer.getTotalSize() - (last.end - scrollMargin)
    : 0;
  const editedLabel = t('list.edited');

  return (
    // The count counts the head as row 1, and tells assistive tech about the rows not in the DOM.
    <table className={TABLE_CLASS} aria-rowcount={rows.length + 1}>
      <ColumnHeads />
      <TableBody
        ref={bodyRef}
        className={cn(!keepLastRule && CLOSED_LAST_ROW_CLASS)}
      >
        {paddingTop > 0 && <SpacerRow height={paddingTop} />}
        {items.map((item) => {
          const row = rows[item.index];
          return (
            <TranslationsTableRow
              key={item.key}
              index={item.index}
              row={row}
              sectionLabel={sectionLabels[row.namespace]}
              editedLabel={editedLabel}
              rowRef={virtualizer.measureElement}
              onOpen={onOpen}
            />
          );
        })}
        {paddingBottom > 0 && <SpacerRow height={paddingBottom} />}
      </TableBody>
    </table>
  );
});

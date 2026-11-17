import { Fragment, memo, type Ref } from 'react';

import { LANGUAGES, type Language } from '@/app/language';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  currentText,
  type TranslationRow
} from '@/features/admin-translations/translation-catalog';
import {
  ROW_OPEN_CLASS,
  ROW_OPENER,
  ROW_OPENER_CLASS,
  rowOpenHandlers
} from '@/lib/row-open';
import { cn } from '@/lib/utils';

// The rules sit on the cells, since a row's border does not paint in `border-separate`.
export const RULE_CLASS = 'border-b border-warm-line';

/** A dotted key that wraps after a dot rather than mid-word. */
function KeyPath({ path }: { path: string }) {
  return path.split('.').map((part, index) => (
    <Fragment key={index}>
      {index > 0 && (
        <>
          .<wbr />
        </>
      )}
      {part}
    </Fragment>
  ));
}

function TextCell({
  row,
  language,
  editedLabel
}: {
  row: TranslationRow;
  language: Language;
  editedLabel: string;
}) {
  const text = currentText(row, language);
  const edited = row.overrides[language] !== undefined;

  return (
    <TableCell
      className={cn('whitespace-normal py-2.5 align-top last:pr-5', RULE_CLASS)}
    >
      {text === undefined ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <div className="flex min-w-0 items-start gap-2">
          {edited && (
            <>
              <span
                aria-hidden="true"
                title={editedLabel}
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
              />
              <span className="sr-only">{editedLabel}</span>
            </>
          )}
          <span className="line-clamp-3 min-w-0 break-words text-sm text-foreground">
            {text}
          </span>
        </div>
      )}
    </TableCell>
  );
}

/** Memoized, so rows already on screen skip the render each time the table scrolls. */
export const TranslationsTableRow = memo(function TranslationsTableRow({
  index,
  row,
  sectionLabel,
  editedLabel,
  rowRef,
  onOpen
}: {
  /** The row's place in the whole filtered list, not among the rendered rows. */
  index: number;
  row: TranslationRow;
  sectionLabel: string;
  editedLabel: string;
  rowRef: Ref<HTMLTableRowElement>;
  onOpen: (row: TranslationRow) => void;
}) {
  return (
    <TableRow
      ref={rowRef}
      // The virtualizer reads data-index to measure the row; the head is aria row 1.
      data-index={index}
      aria-rowindex={index + 2}
      {...rowOpenHandlers}
      className={ROW_OPEN_CLASS}
    >
      <TableCell
        className={cn('whitespace-normal py-2.5 pl-5 align-top', RULE_CLASS)}
      >
        <button
          type="button"
          {...ROW_OPENER}
          className={cn(
            'flex w-full min-w-0 cursor-pointer flex-col items-start border-0 bg-transparent p-0 text-left',
            ROW_OPENER_CLASS
          )}
          onClick={() => onOpen(row)}
        >
          <span className="text-xs text-muted-foreground">{sectionLabel}</span>
          <span className="break-words font-mono text-xs text-foreground">
            <span className="text-muted-foreground">{row.namespace}:</span>
            <wbr />
            <KeyPath path={row.key} />
          </span>
        </button>
      </TableCell>
      {LANGUAGES.map((language) => (
        <TextCell
          key={language}
          row={row}
          language={language}
          editedLabel={editedLabel}
        />
      ))}
    </TableRow>
  );
});

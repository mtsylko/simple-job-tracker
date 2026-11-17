// One row in width shares when wide; count column and default on line 2 at @md; count in words on phones.
export const TAXONOMY_GRID_CLASS =
  'grid-cols-[24px_minmax(0,1fr)_72px] @md:grid-cols-[24px_minmax(0,1fr)_64px_72px] @xl:grid-cols-[24px_minmax(0,1.5fr)_minmax(0,1fr)_auto_72px]';

// In rem, not px: a px container query is emitted before @md and loses to it.
export const STATUS_GRID_CLASS =
  'grid-cols-[24px_minmax(0,1fr)_72px] @md:grid-cols-[24px_minmax(0,1fr)_64px_72px] @min-[47.5rem]:grid-cols-[24px_minmax(0,1.5fr)_minmax(0,0.5fr)_minmax(0,1.25fr)_minmax(0,0.75fr)_auto_72px]';

// One row's chrome, shared by both lists.
export const OPTION_ROW_CLASS =
  'grid items-center gap-x-3 gap-y-2 border-b border-warm-line px-4 py-2.5 text-sm last:border-b-0 sm:px-5';

// Start and end lines, not a span: a span would reset the start line.
export const SECOND_LINE_CLASS =
  'col-start-2 col-end-4 row-start-2 flex flex-wrap items-center gap-x-4 gap-y-2 @md:col-end-5';

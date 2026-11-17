export type JobTaxonomyOption = {
  id: string;
  value: string;
  sortOrder: number;
  isDefault: boolean;
  usageCount: number;
};

export type CreateJobTaxonomyOptionInput = {
  value: string;
};

export type UpdateJobTaxonomyOptionInput = {
  value: string;
};

export type ReorderJobTaxonomyOptionsInput = {
  orderedIds: string[];
};

// --- Status taxonomy ---------------------------------------------------------
// Status is a per-user taxonomy like role/level/type, but each option also
// carries display metadata the plain taxonomies don't need (a colour, and
// whether it appears as a list tab).

/**
 * A status colour is a hex string chosen with the colour picker. It is treated
 * as the badge's accent (dot); the badge's pale fill, border and readable text
 * are derived from it at render time. Must match `HEX_COLOR_PATTERN`.
 */
export type JobStatusColor = string;

/** Validates a `#rrggbb` hex colour (the form the picker emits). */
export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Quick-pick presets shown in the colour picker and used to seed built-ins. */
export const STATUS_COLOR_PRESETS = [
  '#4a6088',
  '#2a6fb5',
  '#1f7c88',
  '#2c8552',
  '#a8801f',
  '#6259a8',
  '#b23a48',
  '#6b6b6b'
] as const;

export type JobStatusOption = JobTaxonomyOption & {
  color: JobStatusColor;
  /** Whether the status gets its own filter tab on the applications list. */
  showAsTab: boolean;
};

export type CreateJobStatusOptionInput = {
  value: string;
  color: JobStatusColor;
  showAsTab?: boolean;
};

export type UpdateJobStatusOptionInput = Partial<CreateJobStatusOptionInput>;

/**
 * The statuses seeded for every user. Editing this list only affects users
 * seeded from then on — the migration holds its own frozen copy for the rest.
 */
export const BUILT_IN_JOB_STATUSES = [
  { value: 'Applied', color: '#4a6088', showAsTab: true },
  { value: 'HR', color: '#2a6fb5', showAsTab: true },
  { value: 'Technical', color: '#a8801f', showAsTab: true },
  { value: 'Contacted me', color: '#6259a8', showAsTab: false },
  { value: 'Test task', color: '#1f7c88', showAsTab: false },
  { value: 'Offer', color: '#2c8552', showAsTab: true }
] as const satisfies ReadonlyArray<
  Omit<CreateJobStatusOptionInput, 'showAsTab'> & { showAsTab: boolean }
>;

// --- Outcome taxonomy --------------------------------------------------------
// Outcome ("why the application ended") is a plain value-only taxonomy like
// role/level/type — it reuses JobTaxonomyOption, no extra display metadata.

/**
 * The fixed set of outcome labels seeded for every user. This is a closed,
 * compile-time set (unlike the user-authored `JobOutcome` value, which is a
 * free string), so it is an enum. Kept narrow on purpose; users add their own
 * on the Taxonomies page. The migration holds its own frozen copy, so editing
 * this only affects users seeded from then on.
 */
export enum BuiltInJobOutcome {
  Rejected = 'Rejected',
  Withdrawn = 'Withdrawn',
  Ghosted = 'Ghosted',
  PositionClosed = 'Position closed'
}

/** The built-in outcomes as a seed-ordered list. */
export const BUILT_IN_JOB_OUTCOMES: BuiltInJobOutcome[] =
  Object.values(BuiltInJobOutcome);

// --- Employment-type taxonomy ------------------------------------------------
// Work-time dimension (full-time/part-time/…). A plain value-only taxonomy like
// role/level/type/outcome; the migration holds its own frozen copy, so editing
// this only affects users seeded from then on.

/** The employment types seeded for every user. */
export const BUILT_IN_EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Internship',
  'Temporary'
] as const;

// --- Contract-type taxonomy --------------------------------------------------
// Legal contract form (Contract of Employment/B2B/…). A plain value-only
// taxonomy; the migration holds its own frozen copy, so editing this only
// affects users seeded from then on.

/** The contract types seeded for every user. */
export const BUILT_IN_CONTRACT_TYPES = [
  'Contract of Employment',
  'B2B',
  'Contract of Mandate',
  'Contract for Specific Work'
] as const;

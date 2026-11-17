/**
 * Per-user field ordering for the application form, keyed by section id.
 *
 * The API treats both the section ids and the field ids as opaque strings: they
 * are frontend presentation keys, not `jobs` columns, and the set of them changes
 * whenever the form changes. The frontend reconciles a stored layout against the
 * fields it currently renders, so unknown ids are ignored and newly added fields
 * fall in at the end rather than disappearing.
 */
export type FormLayout = Record<string, string[]>;

export type UpdateFormLayoutInput = {
  layout: FormLayout;
};

import type { JobFieldDefinition } from '@job-tracker/shared';

/**
 * Drops archived definitions and sorts the rest by their stored order. Archived
 * ones stop rendering but keep their stored values readable, so both the
 * management screen and the form filter through here.
 */
export function activeDefinitions(
  definitions: JobFieldDefinition[]
): JobFieldDefinition[] {
  return definitions
    .filter((definition) => definition.archivedAt === null)
    .sort((first, second) => first.sortOrder - second.sortOrder);
}

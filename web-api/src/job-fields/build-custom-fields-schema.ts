import type { JobFieldDefinition } from '@job-tracker/shared';
import { z } from 'zod';

function valueSchema(definition: JobFieldDefinition): z.ZodTypeAny {
  switch (definition.type) {
    case 'text':
    case 'textarea':
      return z.string().trim();
    case 'number':
      return z.number().finite();
    case 'date':
      return z
        .string()
        .trim()
        .refine((value) => !Number.isNaN(new Date(value).getTime()), {
          message: `${definition.label} must be a valid date`
        });
    case 'boolean':
      return z.boolean();
    case 'select':
      return optionSchema(definition);
    case 'multiselect':
      return z.array(optionSchema(definition));
  }
}

/**
 * Guards against an option list that is somehow empty: `z.enum([])` would accept
 * nothing useful, so be explicit that no value is valid rather than silently
 * degrading to an unvalidated string.
 */
function optionSchema(definition: JobFieldDefinition): z.ZodTypeAny {
  const options = definition.options ?? [];
  return options.length > 0
    ? z.enum(options as [string, ...string[]])
    : z.never();
}

/** A required field must be present and non-empty; anything else may be omitted or null. */
function requiredSchema(definition: JobFieldDefinition): z.ZodTypeAny {
  const base = valueSchema(definition);

  if (definition.type === 'text' || definition.type === 'textarea') {
    return (base as z.ZodString).min(1, `${definition.label} is required`);
  }

  if (definition.type === 'multiselect') {
    return (base as z.ZodArray<z.ZodTypeAny>).min(
      1,
      `${definition.label} is required`
    );
  }

  return base;
}

/**
 * Builds the validation schema for one user's `customFields` payload.
 *
 * Only active definitions are accepted, so writes to an archived field are
 * rejected while its stored values stay readable. `.strict()` means a key with no
 * definition is a 400 rather than a silent write of unreachable data.
 */
export function buildCustomFieldsSchema(
  definitions: JobFieldDefinition[]
): z.ZodType<Record<string, unknown>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const definition of definitions) {
    if (definition.archivedAt) {
      continue;
    }

    shape[definition.key] = definition.required
      ? requiredSchema(definition)
      : valueSchema(definition).nullable().optional();
  }

  return z.object(shape).strict();
}

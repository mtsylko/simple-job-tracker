import type { FormLayout } from '@job-tracker/shared';
import { request } from '@/lib/api-client';

const FORM_LAYOUT_ENDPOINT = '/api/form-layout';

/** Normalizes to a plain record so a malformed payload cannot crash the form. */
function normalizeLayout(payload: unknown): FormLayout {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }

  const layout: FormLayout = {};
  for (const [section, ids] of Object.entries(
    payload as Record<string, unknown>
  )) {
    if (Array.isArray(ids)) {
      layout[section] = ids.filter(
        (id): id is string => typeof id === 'string'
      );
    }
  }

  return layout;
}

export async function fetchFormLayout(): Promise<FormLayout> {
  return normalizeLayout(await request<unknown>(FORM_LAYOUT_ENDPOINT));
}

export async function saveFormLayout(layout: FormLayout): Promise<FormLayout> {
  return normalizeLayout(
    await request<unknown>(FORM_LAYOUT_ENDPOINT, {
      method: 'PUT',
      body: JSON.stringify({ layout })
    })
  );
}

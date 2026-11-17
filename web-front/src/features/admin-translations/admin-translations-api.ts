import type {
  TranslationOverride,
  UpsertTranslationOverrideInput
} from '@job-tracker/shared';
import { request } from '@/lib/api-client';

const ENDPOINT = '/api/admin/translations';

export function listTranslationOverrides(): Promise<TranslationOverride[]> {
  return request<TranslationOverride[]>(ENDPOINT);
}

export function saveTranslationOverride(
  input: UpsertTranslationOverrideInput
): Promise<TranslationOverride> {
  return request<TranslationOverride>(ENDPOINT, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export function deleteTranslationOverride(id: string): Promise<void> {
  return request<void>(`${ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

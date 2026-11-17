import type { AdminFeedback, UpdateFeedbackInput } from '@job-tracker/shared';
import { request } from '@/lib/api-client';

const ENDPOINT = '/api/admin/feedback';

export function listAdminFeedback(): Promise<AdminFeedback[]> {
  return request<AdminFeedback[]>(ENDPOINT);
}

export function updateAdminFeedback(
  id: string,
  input: UpdateFeedbackInput
): Promise<AdminFeedback> {
  return request<AdminFeedback>(`${ENDPOINT}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
}

import type { CreateFeedbackInput } from '@job-tracker/shared';
import { request } from '@/lib/api-client';

export function sendFeedback(input: CreateFeedbackInput): Promise<void> {
  return request<void>('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

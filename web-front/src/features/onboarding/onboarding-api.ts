import type { ApplyPresetInput } from '@job-tracker/shared';

import { request } from '@/lib/api-client';

/** Seeds the values the user kept from a preset and closes onboarding. */
export async function applyPreset(input: ApplyPresetInput): Promise<void> {
  await request<void>('/api/presets/apply', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

/** Closes onboarding without adding anything. */
export async function skipOnboarding(): Promise<void> {
  await request<void>('/api/presets/skip', { method: 'POST' });
}

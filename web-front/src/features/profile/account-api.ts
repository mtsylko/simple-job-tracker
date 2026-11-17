import { request } from '@/lib/api-client';

const ENDPOINT = '/api/account';

/** Saves everything the account holds as one JSON file. */
export async function downloadAccountExport(): Promise<void> {
  const data = await request<unknown>(`${ENDPOINT}/export`);
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `job-tracker-export-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function deleteAccount(): Promise<void> {
  return request<void>(ENDPOINT, { method: 'DELETE' });
}

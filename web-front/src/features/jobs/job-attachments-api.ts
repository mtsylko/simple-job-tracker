import type { JobAttachment } from '@job-tracker/shared';

import { saveBlobAs } from '@/features/cv-versions/attachment';
import { readApiError, request } from '@/lib/api-client';
import { redirectIfSignedOut } from '@/lib/session-expiry';
import { viewAsHeaders } from '@/lib/view-as';

function attachmentsUrl(jobId: string): string {
  return `/api/jobs/${encodeURIComponent(jobId)}/attachments`;
}

function attachmentUrl(jobId: string, attachmentId: string): string {
  return `${attachmentsUrl(jobId)}/${encodeURIComponent(attachmentId)}`;
}

export function listJobAttachments(jobId: string): Promise<JobAttachment[]> {
  return request<JobAttachment[]>(attachmentsUrl(jobId));
}

export async function uploadJobAttachment(
  jobId: string,
  file: File
): Promise<JobAttachment> {
  const url = attachmentsUrl(jobId);
  const body = new FormData();
  body.append('file', file);

  // No Content-Type: the browser sets the multipart boundary itself.
  const response = await fetch(url, {
    method: 'POST',
    headers: viewAsHeaders(url),
    body
  });
  if (!response.ok) {
    redirectIfSignedOut(response.status);
    throw new Error(await readApiError(response));
  }
  return (await response.json()) as JobAttachment;
}

export function deleteJobAttachment(
  jobId: string,
  attachmentId: string
): Promise<void> {
  return request<void>(attachmentUrl(jobId, attachmentId), {
    method: 'DELETE'
  });
}

export async function downloadJobAttachment(
  jobId: string,
  attachment: JobAttachment
): Promise<void> {
  const url = attachmentUrl(jobId, attachment.id);
  const response = await fetch(url, { headers: viewAsHeaders(url) });
  if (!response.ok) {
    redirectIfSignedOut(response.status);
    throw new Error(await readApiError(response));
  }

  saveBlobAs(await response.blob(), attachment.fileName);
}

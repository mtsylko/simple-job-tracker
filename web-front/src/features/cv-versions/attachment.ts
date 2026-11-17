/** Attachments are stored as `/uploads/...` paths, or absolute URLs on imported records. */

export function attachmentLabel(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return '';
  const withoutQuery = trimmed.split('?')[0] ?? trimmed;
  const parts = withoutQuery.split('/');
  return parts[parts.length - 1] ?? trimmed;
}

export async function downloadAttachment(
  url: string,
  filename: string
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download attachment (${response.status})`);
  }

  saveBlobAs(await response.blob(), filename);
}

/** Hands a blob to the browser as a file download. */
export function saveBlobAs(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Safari and Firefox start the download after click() returns.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

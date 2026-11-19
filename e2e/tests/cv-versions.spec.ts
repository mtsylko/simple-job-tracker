import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '../support/fixtures';

const CV_FILE = path.join(__dirname, '..', 'fixtures', 'cv.pdf');

test('uploads a CV and serves the file back to its owner', async ({ page }) => {
  await page.goto('/cv-versions');
  await page.getByRole('button', { name: 'New CV version' }).click();

  await page.getByRole('textbox', { name: 'Name *' }).fill('Backend CV');
  const fileChooser = page.waitForEvent('filechooser');
  const upload = page.waitForResponse('**/api/cv-versions/upload-attachment');
  await page.getByRole('button', { name: 'Upload file' }).click();
  await (await fileChooser).setFiles(CV_FILE);
  expect((await upload).ok()).toBe(true);
  // The form refuses to submit while its progress bar stays up, a moment past the upload.
  await expect(
    page.getByRole('progressbar', { name: 'Attachment upload progress' })
  ).toHaveCount(0);
  await expect(page.getByText('cv.pdf')).toBeVisible();
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page).toHaveURL('/cv-versions');
  await expect(page.getByText('CV version created')).toBeVisible();
  const row = page
    .getByRole('row')
    .filter({ has: page.getByRole('link', { name: 'Backend CV' }) });
  await expect(row).toBeVisible();

  const download = page.waitForEvent('download');
  await row.getByRole('button', { name: 'Download' }).click();
  const downloaded = await (await download).path();
  expect(await readFile(downloaded)).toEqual(await readFile(CV_FILE));
});

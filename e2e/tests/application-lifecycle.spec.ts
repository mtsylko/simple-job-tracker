import {
  applicationInput,
  applicationRow,
  chooseRowAction,
  statusTab
} from '../support/applications';
import { expect, test } from '../support/fixtures';
import { JobForm } from '../support/job-form';

test.beforeEach(async ({ api }) => {
  await api.createJob(applicationInput({ company: 'Acme' }));
});

test('moves an application to the next stage', async ({ page }) => {
  const form = new JobForm(page);
  await page.goto('/applications');

  await page.getByRole('link', { name: 'Acme', exact: true }).click();
  await expect(form.company).toHaveValue('Acme');
  await form.status('HR').check();
  await form.save();

  await expect(page.getByText('Application updated')).toBeVisible();
  const row = applicationRow(page, 'Acme');
  await expect(
    row.getByRole('cell', { name: 'HR', exact: true })
  ).toBeVisible();
  await expect(statusTab(page, 'HR', 1)).toBeVisible();
  await expect(statusTab(page, 'Applied', 0)).toBeVisible();

  await page.reload();
  await page.getByRole('link', { name: 'Acme', exact: true }).click();
  await expect(form.status('HR')).toBeChecked();
});

test('archives an application out of the active list', async ({ page }) => {
  await page.goto('/applications');

  await chooseRowAction(page, 'Acme', 'Archive');

  await expect(page.getByText('Application archived')).toBeVisible();
  await expect(applicationRow(page, 'Acme')).toBeHidden();

  await page.getByRole('combobox', { name: 'Show' }).click();
  await page.getByRole('option', { name: 'Archived only' }).click();
  await expect(applicationRow(page, 'Acme')).toBeVisible();
});

test('archives the selected applications at once', async ({ api, page }) => {
  await api.createJob(applicationInput({ company: 'Globex' }));
  await api.createJob(applicationInput({ company: 'Initech' }));
  await page.goto('/applications');

  await page.getByRole('checkbox', { name: 'Select Acme' }).check();
  await page.getByRole('checkbox', { name: 'Select Globex' }).check();
  await page
    .getByRole('toolbar', { name: 'Selected applications' })
    .getByRole('button', { name: 'Archive' })
    .click();

  await expect(page.getByText('2 applications archived')).toBeVisible();
  await expect(applicationRow(page, 'Acme')).toBeHidden();
  await expect(applicationRow(page, 'Globex')).toBeHidden();
  await expect(applicationRow(page, 'Initech')).toBeVisible();
});

test('deletes an application once confirmed', async ({ page }) => {
  await page.goto('/applications');

  await chooseRowAction(page, 'Acme', 'Delete');
  const dialog = page.getByRole('alertdialog', {
    name: 'Delete the Acme application?'
  });
  await dialog.getByRole('button', { name: 'Delete' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText('Application deleted')).toBeVisible();
  await expect(page.getByText('No applications yet')).toBeVisible();

  await page.reload();
  await expect(page.getByText('No applications yet')).toBeVisible();
});

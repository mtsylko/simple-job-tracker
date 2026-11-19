import { applicationRow, statusTab } from '../support/applications';
import { expect, SEED, test } from '../support/fixtures';
import { JobForm } from '../support/job-form';

test('files a new application through the form', async ({ page }) => {
  const form = new JobForm(page);
  await page.goto('/applications');
  await expect(page.getByText('No applications yet')).toBeVisible();

  await page.getByRole('button', { name: 'New application' }).first().click();
  await expect(page).toHaveURL('/jobs/create');

  await form.submit();
  for (const message of [
    'Company name is required',
    'Job post link is required',
    'Role is required',
    'Level is required',
    'Type is required',
    'CV is required'
  ]) {
    await expect(page.getByText(message)).toBeVisible();
  }

  await form.fillRequired({
    company: 'Globex',
    jobPostLink: 'https://jobs.example.test/globex/frontend',
    role: SEED.role,
    level: 'Senior',
    type: 'Remote',
    cv: SEED.cv
  });
  await form.submit();

  await expect(page.getByText('Application created')).toBeVisible();
  const row = applicationRow(page, 'Globex');
  await expect(row).toBeVisible();
  await expect(
    row.getByRole('cell', { name: 'Applied', exact: true })
  ).toBeVisible();
  await expect(row.getByRole('cell', { name: SEED.cv })).toBeVisible();
  await expect(statusTab(page, 'Applied', 1)).toBeVisible();
});

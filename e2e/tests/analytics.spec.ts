import { applicationInput } from '../support/applications';
import { expect, SEED, test } from '../support/fixtures';

test('sums up the applications on file', async ({ page, api }) => {
  await api.createJob(applicationInput({ company: 'Acme' }));
  await api.createJob(applicationInput({ company: 'Globex', status: 'HR' }));
  await api.createJob(
    applicationInput({ company: 'Initech', status: 'Offer' })
  );

  await page.goto('/analytics');

  // The figures sit in bare elements beside their labels, so the text runs together.
  const totals = page.getByRole('region', { name: 'Totals' });
  await expect(totals).toContainText(/Sent\s*3/);
  await expect(totals).toContainText(/Heard back\s*2/);

  const stages = page
    .getByRole('region', { name: 'Where they stand' })
    .getByRole('listitem');
  for (const stage of ['Applied', 'HR', 'Offer']) {
    await expect(stages.filter({ hasText: stage })).toHaveText(
      new RegExp(`^${stage}\\s*1\\s*33%$`)
    );
  }

  await expect(
    page
      .getByRole('region', { name: 'CV versions' })
      .getByRole('row', { name: `${SEED.cv} 3 2 67%` })
  ).toBeVisible();
});

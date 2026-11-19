import type { Locator, Page } from '@playwright/test';
import type { CreateJobInput } from '@job-tracker/shared';

import { SEED } from './fixtures';

/** An application that passes validation, filed with the account's seeded values. */
export function applicationInput(
  overrides: Partial<CreateJobInput> = {}
): CreateJobInput {
  return {
    company: 'Acme',
    isProductCompany: true,
    jobPostLink: 'https://jobs.example.test/acme/frontend',
    role: SEED.role,
    level: 'Senior',
    type: 'Remote',
    cv: SEED.cv,
    appliedAt: new Date().toISOString(),
    ...overrides
  };
}

/** The table row of one application, found by its company name. */
export function applicationRow(page: Page, company: string): Locator {
  return page
    .getByRole('row')
    .filter({ has: page.getByRole('link', { name: company, exact: true }) });
}

/** The `/applications` status tab, named like "Applied 2". */
export function statusTab(page: Page, status: string, count: number): Locator {
  return page.getByRole('tab', { name: `${status} ${count}`, exact: true });
}

/** Picks an item from a row's "Actions for …" menu. */
export async function chooseRowAction(
  page: Page,
  company: string,
  action: string
): Promise<void> {
  await page.getByRole('button', { name: `Actions for ${company}` }).click();
  await page
    .getByRole('menu', { name: `Actions for ${company}` })
    .getByRole('menuitem', { name: action, exact: true })
    .click();
}

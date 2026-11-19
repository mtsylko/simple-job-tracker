import type { Locator, Page } from '@playwright/test';

type RequiredFields = {
  company: string;
  jobPostLink: string;
  role: string;
  level: string;
  type: string;
  cv: string;
};

/** The application form at `/jobs/create` and `/jobs/edit/:id`. */
export class JobForm {
  readonly company: Locator;

  constructor(private readonly page: Page) {
    this.company = page.getByRole('combobox', { name: 'Company name *' });
  }

  async fillRequired(fields: RequiredFields): Promise<void> {
    await this.company.fill(fields.company);
    await this.option(fields.company).click();
    await this.page
      .getByRole('textbox', { name: 'Job post link *' })
      .fill(fields.jobPostLink);
    await this.select('Role *', fields.role);
    await this.select('Level *', fields.level);
    await this.select('Work type *', fields.type);
    await this.select('CV used *', fields.cv);
  }

  /** One stage of the status radio group, shown when editing. */
  status(status: string): Locator {
    return this.page
      .getByRole('radiogroup', { name: 'Status' })
      .getByRole('radio', { name: status, exact: true });
  }

  /** The create form's button. */
  submit(): Promise<void> {
    return this.page.getByRole('button', { name: 'Submit' }).click();
  }

  /** The edit form's button. */
  save(): Promise<void> {
    return this.page.getByRole('button', { name: 'Save changes' }).click();
  }

  private async select(label: string, value: string): Promise<void> {
    await this.page.getByRole('combobox', { name: label }).click();
    await this.option(value).click();
  }

  private option(name: string): Locator {
    return this.page
      .getByRole('listbox')
      .getByRole('option', { name, exact: true });
  }
}

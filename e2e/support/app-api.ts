import {
  expect,
  type APIRequestContext,
  type APIResponse
} from '@playwright/test';
import type {
  ApplyPresetInput,
  CreateCvVersionInput,
  CreateJobInput
} from '@job-tracker/shared';

/** The API names a record's id `_id`, a leftover from its Mongo days. */
type Created = { _id: string };
export type CreatedRecord = { id: string };

/** Sets the stage over HTTP as the signed-in account, so the UI is spent only on what a test checks. */
export class AppApi {
  constructor(private readonly request: APIRequestContext) {}

  /** Finishes onboarding the way the first-run screen does. */
  async applyPreset(input: ApplyPresetInput): Promise<void> {
    await this.send('/api/presets/apply', input);
  }

  createCvVersion(input: CreateCvVersionInput): Promise<CreatedRecord> {
    return this.create('/api/cv-versions', input);
  }

  createJob(input: CreateJobInput): Promise<CreatedRecord> {
    return this.create('/api/jobs', input);
  }

  private async create(url: string, data: unknown): Promise<CreatedRecord> {
    const response = await this.send(url, data);
    const { _id } = (await response.json()) as Created;
    return { id: _id };
  }

  private async send(url: string, data: unknown): Promise<APIResponse> {
    const response = await this.request.post(url, { data });
    await expect(response, `POST ${url}`).toBeOK();
    return response;
  }
}

import { randomUUID } from 'node:crypto';
import type { JwtService } from '@nestjs/jwt';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { BUILT_IN_JOB_STATUSES } from '@job-tracker/shared';
import { AuthService } from '../src/auth/auth.service';
import { UserEntity } from '../src/auth/user.entity';
import { JobContractTypeOptionEntity } from '../src/job-contract-types/job-contract-type-option.entity';
import { JobContractTypesService } from '../src/job-contract-types/job-contract-types.service';
import { JobEmploymentTypeOptionEntity } from '../src/job-employment-types/job-employment-type-option.entity';
import { JobEmploymentTypesService } from '../src/job-employment-types/job-employment-types.service';
import { JobOutcomeOptionEntity } from '../src/job-outcomes/job-outcome-option.entity';
import { JobOutcomesService } from '../src/job-outcomes/job-outcomes.service';
import { JobStatusOptionEntity } from '../src/job-statuses/job-status-option.entity';
import { JobStatusesService } from '../src/job-statuses/job-statuses.service';
import { JobEntity } from '../src/jobs/job.entity';
import { createTestDatabase, type TestDatabase } from './support/database';

let db: TestDatabase;
let auth: AuthService;
let contractTypes: JobContractTypesService;

beforeAll(async () => {
  db = await createTestDatabase();
  const repository = db.dataSource.getRepository.bind(db.dataSource);
  const jobRepository = repository(JobEntity);

  contractTypes = new JobContractTypesService(
    repository(JobContractTypeOptionEntity),
    jobRepository
  );
  auth = new AuthService(
    repository(UserEntity),
    // Only signing a token reaches it.
    {} as JwtService,
    new JobStatusesService(repository(JobStatusOptionEntity), jobRepository),
    new JobOutcomesService(repository(JobOutcomeOptionEntity), jobRepository),
    new JobEmploymentTypesService(
      repository(JobEmploymentTypeOptionEntity),
      jobRepository
    ),
    contractTypes
  );
}, 120_000);

afterAll(async () => {
  await db?.drop();
});

function profile() {
  const googleId = randomUUID();
  return {
    googleId,
    email: `${googleId}@example.test`,
    displayName: null,
    avatarUrl: null
  };
}

async function statusCount(userId: string): Promise<number> {
  return db.dataSource.getRepository(JobStatusOptionEntity).countBy({ userId });
}

describe('signing up', () => {
  it('creates the account with its built-in lists', async () => {
    const user = await auth.findOrCreateGoogleUser(profile());

    expect(await statusCount(user.id)).toBe(BUILT_IN_JOB_STATUSES.length);
  });

  it('creates nothing when a list fails to seed, so the next sign-in starts over', async () => {
    const person = profile();
    const failing = vi
      .spyOn(contractTypes, 'seedDefaults')
      .mockRejectedValueOnce(new Error('connection lost'));

    await expect(auth.findOrCreateGoogleUser(person)).rejects.toThrow(
      'connection lost'
    );
    failing.mockRestore();
    const users = db.dataSource.getRepository(UserEntity);
    expect(await users.countBy({ googleId: person.googleId })).toBe(0);

    const user = await auth.findOrCreateGoogleUser(person);
    expect(await statusCount(user.id)).toBe(BUILT_IN_JOB_STATUSES.length);
  });
});

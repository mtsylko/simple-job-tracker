import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  BUILT_IN_JOB_STATUSES,
  type CreateJobInput
} from '@job-tracker/shared';
import { UserEntity } from '../src/auth/user.entity';
import { JobContractTypeOptionEntity } from '../src/job-contract-types/job-contract-type-option.entity';
import { JobContractTypesService } from '../src/job-contract-types/job-contract-types.service';
import { JobEmploymentTypeOptionEntity } from '../src/job-employment-types/job-employment-type-option.entity';
import { JobEmploymentTypesService } from '../src/job-employment-types/job-employment-types.service';
import { JobFieldDefinitionEntity } from '../src/job-fields/job-field-definition.entity';
import { JobFieldsService } from '../src/job-fields/job-fields.service';
import { JobLevelOptionEntity } from '../src/job-levels/job-level-option.entity';
import { JobLevelsService } from '../src/job-levels/job-levels.service';
import { JobOutcomeOptionEntity } from '../src/job-outcomes/job-outcome-option.entity';
import { JobOutcomesService } from '../src/job-outcomes/job-outcomes.service';
import { JobRoleOptionEntity } from '../src/job-roles/job-role-option.entity';
import { JobRolesService } from '../src/job-roles/job-roles.service';
import { JobStatusOptionEntity } from '../src/job-statuses/job-status-option.entity';
import { JobStatusesService } from '../src/job-statuses/job-statuses.service';
import { JobTypeOptionEntity } from '../src/job-types/job-type-option.entity';
import { JobTypesService } from '../src/job-types/job-types.service';
import type { JobAttachmentsService } from '../src/jobs/job-attachments.service';
import { JobEntity } from '../src/jobs/job.entity';
import { JobsService } from '../src/jobs/jobs.service';
import { createTestDatabase, type TestDatabase } from './support/database';

let db: TestDatabase;
let roles: JobRolesService;
let statuses: JobStatusesService;
let jobs: JobsService;

beforeAll(async () => {
  db = await createTestDatabase();
  const repository = db.dataSource.getRepository.bind(db.dataSource);
  const jobRepository = repository(JobEntity);

  roles = new JobRolesService(repository(JobRoleOptionEntity), jobRepository);
  statuses = new JobStatusesService(
    repository(JobStatusOptionEntity),
    jobRepository
  );
  jobs = new JobsService(
    jobRepository,
    roles,
    new JobLevelsService(repository(JobLevelOptionEntity), jobRepository),
    new JobTypesService(repository(JobTypeOptionEntity), jobRepository),
    new JobEmploymentTypesService(
      repository(JobEmploymentTypeOptionEntity),
      jobRepository
    ),
    new JobContractTypesService(
      repository(JobContractTypeOptionEntity),
      jobRepository
    ),
    statuses,
    new JobOutcomesService(repository(JobOutcomeOptionEntity), jobRepository),
    new JobFieldsService(repository(JobFieldDefinitionEntity), jobRepository),
    // Only deleting a job reaches its attachments.
    {} as JobAttachmentsService
  );
}, 120_000);

afterAll(async () => {
  await db?.drop();
});

/** A new account, seeded with the statuses every account starts with. */
async function newUser(): Promise<string> {
  const id = randomUUID();
  await db.dataSource
    .getRepository(UserEntity)
    .insert({ id, email: `${id}@example.test` });
  await statuses.seedDefaults(id);
  return id;
}

function jobInput(overrides: Partial<CreateJobInput> = {}): CreateJobInput {
  return {
    company: 'Acme',
    isProductCompany: true,
    jobPostLink: 'https://jobs.example.test/acme/frontend',
    role: 'Frontend Lead',
    level: 'Senior',
    type: 'Remote',
    cv: 'Main CV',
    appliedAt: new Date().toISOString(),
    ...overrides
  };
}

/** Options in the user's order, by label. */
async function roleIds(userId: string, ...values: string[]): Promise<string[]> {
  for (const value of values) {
    await roles.saveValue(userId, value);
  }
  const options = await roles.listOptions(userId);
  return values.map(
    (value) => options.find((option) => option.value === value)!.id
  );
}

function roleRows(userId: string): Promise<JobRoleOptionEntity[]> {
  return db.dataSource
    .getRepository(JobRoleOptionEntity)
    .find({ where: { userId }, order: { sortOrder: 'ASC' } });
}

describe('saving a job again', () => {
  it('keeps an archived role archived while the job keeps it', async () => {
    const userId = await newUser();
    const job = await jobs.create(userId, jobInput());
    const [lead] = await roleIds(userId, 'Frontend Lead');
    await roles.deleteOption(userId, lead);

    // The form sends the whole record back with every save.
    const saved = await jobs.update(userId, job._id, {
      ...jobInput(),
      notes: 'Called back'
    });

    expect(saved?.role).toBe('Frontend Lead');
    expect(await roles.listValues(userId)).not.toContain('Frontend Lead');
  });

  it('brings an archived role back once a job picks it', async () => {
    const userId = await newUser();
    const job = await jobs.create(userId, jobInput());
    const [lead] = await roleIds(userId, 'Frontend Lead');
    await roles.deleteOption(userId, lead);

    await jobs.update(userId, job._id, { role: 'Backend Engineer' });
    await jobs.update(userId, job._id, { role: 'Frontend Lead' });

    expect(await roles.listValues(userId)).toContain('Frontend Lead');
  });
});

describe('taxonomy writes', () => {
  it('links parallel saves of one new label to a single option', async () => {
    const userId = await newUser();

    const options = await Promise.all(
      Array.from({ length: 8 }, () =>
        roles.resolveOption(userId, 'Staff Engineer')
      )
    );

    expect(new Set(options.map((option) => option?.id)).size).toBe(1);
    expect(await roleRows(userId)).toHaveLength(1);
  });

  it('creates jobs side by side that bring the same new role', async () => {
    const userId = await newUser();

    const created = await Promise.all(
      ['Initech', 'Globex', 'Umbrella'].map((company) =>
        jobs.create(userId, jobInput({ company, role: 'Platform Engineer' }))
      )
    );

    expect(created.map((job) => job.role)).toEqual([
      'Platform Engineer',
      'Platform Engineer',
      'Platform Engineer'
    ]);
  });

  it('archives an option in use, deletes an unused one and moves the default', async () => {
    const userId = await newUser();
    const [used, next, unused] = await roleIds(
      userId,
      'Frontend Lead',
      'Backend Engineer',
      'QA Engineer'
    );
    await jobs.create(userId, jobInput());

    await roles.deleteOption(userId, used);
    await roles.deleteOption(userId, unused);

    const rows = await roleRows(userId);
    expect(rows.map((row) => [row.id, row.archivedAt !== null])).toEqual([
      [used, true],
      [next, false]
    ]);
    expect(rows.find((row) => row.isDefault)?.id).toBe(next);
  });

  it('leaves one default after parallel changes', async () => {
    const userId = await newUser();
    const ids = await roleIds(userId, 'A role', 'B role', 'C role');

    await Promise.all(
      [...ids, ...ids].map((id) => roles.setDefault(userId, id))
    );

    const rows = await roleRows(userId);
    expect(rows.filter((row) => row.isDefault)).toHaveLength(1);
  });

  it('applies parallel reorders one after the other', async () => {
    const userId = await newUser();
    const [a, b, c, d] = await roleIds(
      userId,
      'A role',
      'B role',
      'C role',
      'D role'
    );
    const orders = [
      [d, c, b, a],
      [b, a, d, c],
      [c, d, a, b]
    ];

    await Promise.all(orders.map((order) => roles.reorder(userId, order)));

    const final = (await roleRows(userId)).map((row) => row.id);
    expect(orders).toContainEqual(final);
  });

  it('refuses an order that names an option twice', async () => {
    const userId = await newUser();
    const [a, b, c] = await roleIds(userId, 'A role', 'B role', 'C role');

    await expect(roles.reorder(userId, [a, a, b])).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect((await roleRows(userId)).map((row) => row.id)).toEqual([a, b, c]);
  });

  it('answers two renames to one label with one conflict', async () => {
    const userId = await newUser();
    const [a, b] = await roleIds(userId, 'A role', 'B role');

    const results = await Promise.allSettled([
      roles.updateValue(userId, a, 'Same role'),
      roles.updateValue(userId, b, 'Same role')
    ]);

    expect(results.map((result) => result.status).sort()).toEqual([
      'fulfilled',
      'rejected'
    ]);
    const failure = results.find((result) => result.status === 'rejected');
    expect(failure?.reason).toBeInstanceOf(ConflictException);
  });
});

describe('statuses', () => {
  it('seeds the built-in statuses once', async () => {
    const userId = await newUser();

    await statuses.seedDefaults(userId);

    const options = await statuses.listOptions(userId);
    expect(options.map((option) => option.value)).toEqual(
      BUILT_IN_JOB_STATUSES.map((status) => status.value)
    );
    expect(options.filter((option) => option.isDefault)).toHaveLength(1);
  });

  it('brings back an archived status created again, and refuses an active one', async () => {
    const userId = await newUser();
    await jobs.create(userId, jobInput({ status: 'HR' }));
    const hr = (await statuses.listOptions(userId)).find(
      (option) => option.value === 'HR'
    )!;
    await statuses.deleteOption(userId, hr.id);

    const revived = await statuses.create(userId, {
      value: 'HR',
      color: '#123456'
    });

    expect(revived).toMatchObject({ id: hr.id, color: '#123456' });
    await expect(
      statuses.create(userId, { value: 'HR', color: '#123456' })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses a status nobody created', async () => {
    const userId = await newUser();

    await expect(
      statuses.resolveOption(userId, 'Ghosted')
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('archiving many jobs', () => {
  it('archives only the caller’s active rows and restores them', async () => {
    const userId = await newUser();
    const otherId = await newUser();
    const [first, second, alreadyArchived] = await Promise.all([
      jobs.create(userId, jobInput({ company: 'First' })),
      jobs.create(userId, jobInput({ company: 'Second' })),
      jobs.create(userId, jobInput({ company: 'Third' }))
    ]);
    const archivedEarlier = await jobs.setArchived(
      userId,
      alreadyArchived._id,
      true
    );
    const foreign = await jobs.create(otherId, jobInput());

    const archived = await jobs.setArchivedMany(
      userId,
      [first._id, second._id, alreadyArchived._id, foreign._id],
      true
    );

    expect(archived.map((job) => job._id).sort()).toEqual(
      [first._id, second._id].sort()
    );
    expect(archived.every((job) => job.archivedAt !== null)).toBe(true);
    expect(
      (await jobs.findById(userId, alreadyArchived._id))?.archivedAt
    ).toEqual(archivedEarlier?.archivedAt);
    expect((await jobs.findById(otherId, foreign._id))?.archivedAt).toBeNull();

    const restored = await jobs.setArchivedMany(
      userId,
      [first._id, second._id],
      false
    );
    expect(restored.map((job) => job.archivedAt)).toEqual([null, null]);
  });
});

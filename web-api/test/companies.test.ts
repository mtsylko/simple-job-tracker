import { randomUUID } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { CreateJobInput } from '@job-tracker/shared';
import { UserEntity } from '../src/auth/user.entity';
import { CompaniesService } from '../src/companies/companies.service';
import { CompanyEntity } from '../src/companies/company.entity';
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
let statuses: JobStatusesService;
let jobs: JobsService;
let companies: CompaniesService;

beforeAll(async () => {
  db = await createTestDatabase();
  const repository = db.dataSource.getRepository.bind(db.dataSource);
  const jobRepository = repository(JobEntity);

  statuses = new JobStatusesService(
    repository(JobStatusOptionEntity),
    jobRepository
  );
  jobs = new JobsService(
    jobRepository,
    new JobRolesService(repository(JobRoleOptionEntity), jobRepository),
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
  companies = new CompaniesService(repository(CompanyEntity), jobRepository);
}, 120_000);

afterAll(async () => {
  await db?.drop();
});

async function newUser(): Promise<string> {
  const id = randomUUID();
  await db.dataSource
    .getRepository(UserEntity)
    .insert({ id, email: `${id}@example.test` });
  await statuses.seedDefaults(id);
  return id;
}

function apply(
  userId: string,
  company: string,
  overrides: Partial<CreateJobInput> = {}
) {
  return jobs.create(userId, {
    company,
    isProductCompany: true,
    jobPostLink: `https://jobs.example.test/${randomUUID()}`,
    role: 'Frontend Engineer',
    level: 'Senior',
    type: 'Remote',
    cv: 'Main CV',
    appliedAt: new Date().toISOString(),
    ...overrides
  });
}

function storedRow(userId: string): Promise<CompanyEntity | null> {
  return db.dataSource.getRepository(CompanyEntity).findOne({
    where: { userId }
  });
}

describe('a company page', () => {
  it('lists the applications to it, newest first, whatever the spelling', async () => {
    const userId = await newUser();
    await apply(userId, 'Allegro', { appliedAt: '2026-10-02T10:00:00.000Z' });
    await apply(userId, ' allegro ', {
      role: 'Tech Lead',
      appliedAt: '2026-11-18T10:00:00.000Z'
    });
    await apply(userId, 'Brainly');

    const details = await companies.details(userId, 'ALLEGRO');

    expect(details?.id).toBeNull();
    expect(details?.applications.map((app) => app.role)).toEqual([
      'Tech Lead',
      'Frontend Engineer'
    ]);
    expect(await companies.details(userId, 'Nobody')).toBeNull();
  });

  it('renames the company in every application to it', async () => {
    const userId = await newUser();
    await apply(userId, 'Alegro');
    await apply(userId, 'alegro');

    const saved = await companies.update(userId, {
      company: 'Alegro',
      name: 'Allegro'
    });

    expect(saved?.name).toBe('Allegro');
    const list = await companies.list(userId);
    expect(list.map((company) => company.name)).toEqual(['Allegro']);
    expect(list[0].applicationCount).toBe(2);
  });

  it('refuses a name another company already has', async () => {
    const userId = await newUser();
    await apply(userId, 'Allegro');
    await apply(userId, 'Brainly');

    await expect(
      companies.update(userId, { company: 'Brainly', name: 'allegro' })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('applies the company type to every application to it', async () => {
    const userId = await newUser();
    await apply(userId, 'Codete');
    await apply(userId, 'Codete');

    const saved = await companies.update(userId, {
      company: 'Codete',
      isProductCompany: false
    });

    expect(saved?.isProductCompany).toBe(false);
    const rows = await db.dataSource
      .getRepository(JobEntity)
      .find({ where: { userId } });
    expect(rows.every((job) => job.isProductCompany === false)).toBe(true);
  });

  it('keeps notes when the company leaves the blacklist', async () => {
    const userId = await newUser();
    await apply(userId, 'Netguru');
    await companies.update(userId, {
      company: 'Netguru',
      website: 'https://netguru.com',
      notes: 'Body leasing',
      blacklisted: true,
      blacklistReason: 'Bench between projects'
    });

    const row = await storedRow(userId);
    expect(row?.blacklistReason).toBe('Bench between projects');
    await companies.unblacklist(userId, row!.id);

    const after = await companies.details(userId, 'Netguru');
    expect(after?.blacklist).toBeNull();
    expect(after?.notes).toBe('Body leasing');
    expect(after?.website).toBe('https://netguru.com');
  });

  it('keeps the company once the blacklist is lifted', async () => {
    const userId = await newUser();
    await companies.create(userId, {
      name: 'Bluefin Games',
      blacklisted: true
    });
    const row = await storedRow(userId);

    await companies.unblacklist(userId, row!.id);

    const list = await companies.list(userId);
    expect(list.map((company) => company.name)).toEqual(['Bluefin Games']);
    expect(list[0].blacklist).toBeNull();
  });
});

describe('a company added by hand', () => {
  it('is listed with no applications, blacklisted if asked', async () => {
    const userId = await newUser();

    const created = await companies.create(userId, {
      name: ' Bluefin Games ',
      website: 'https://bluefin.example',
      blacklisted: true,
      blacklistReason: 'Crunch every release'
    });

    expect(created.name).toBe('Bluefin Games');
    expect(created.applications).toEqual([]);
    const [listed] = await companies.list(userId);
    expect(listed.applicationCount).toBe(0);
    expect(listed.blacklist?.reason).toBe('Crunch every release');
  });

  it('is refused under a name already in the list', async () => {
    const userId = await newUser();
    await apply(userId, 'Allegro');
    await companies.create(userId, { name: 'Bluefin Games' });

    await expect(
      companies.create(userId, { name: 'allegro' })
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      companies.create(userId, { name: 'BLUEFIN  games' })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('can be blacklisted before any application to it', async () => {
    const userId = await newUser();

    const blacklisted = await companies.blacklist(
      userId,
      'Bluefin Games',
      null
    );

    expect(blacklisted.blacklist).not.toBeNull();
  });

  it('can be deleted while it has no applications, and not after', async () => {
    const userId = await newUser();
    const lonely = await companies.create(userId, { name: 'Acme Robotics' });
    expect(await companies.remove(userId, lonely.id!)).toBe(true);
    expect(await companies.list(userId)).toEqual([]);

    const applied = await companies.create(userId, { name: 'Bolt' });
    await apply(userId, 'Bolt');
    await expect(companies.remove(userId, applied.id!)).rejects.toBeInstanceOf(
      ConflictException
    );
  });
});

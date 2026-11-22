import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { z } from 'zod';
import {
  BULK_ARCHIVE_MAX_IDS,
  type BulkArchiveJobsInput,
  type CreateJobInput,
  type UpdateJobInput
} from '@job-tracker/shared';
import { JobsService, Job } from './jobs.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { apiError } from '../common/errors/api-error';

const jobRoleSchema = z.string().trim().min(1);
const jobLevelSchema = z.string().trim().min(1);
const jobTypeSchema = z.string().trim().min(1);
const jobCvSchema = z.string().trim().min(1);
// A status option label; resolved to its option (find-only) in JobsService.
const jobStatusSchema = z.string().trim().min(1).optional();
// An outcome option label; resolved to its option (find-or-create) in
// JobsService. Optional and nullable — an application need not have an outcome.
const jobOutcomeSchema = z.string().trim().min(1).nullable().optional();

const createJobSchema = z
  .object({
    company: z.string().trim().min(1),
    isProductCompany: z.boolean(),
    jobPostLink: z.string().trim().url(),
    location: z.string().trim().min(1).nullable().optional(),
    role: jobRoleSchema,
    level: jobLevelSchema,
    salaryRange: z.string().trim().min(1).nullable().optional(),
    salaryExpectations: z.string().trim().min(1).nullable().optional(),
    appliedAt: z
      .string()
      .trim()
      .min(1)
      .refine((value) => !Number.isNaN(new Date(value).getTime()), {
        message: 'appliedAt must be a valid date string'
      }),
    type: jobTypeSchema,
    employmentType: z.string().trim().min(1).nullable().optional(),
    contractType: z.string().trim().min(1).nullable().optional(),
    cv: jobCvSchema,
    status: jobStatusSchema,
    outcome: jobOutcomeSchema,
    notes: z.string().trim().min(1).nullable().optional(),
    applicationQuestions: z.string().trim().min(1).nullable().optional(),
    // Shape only — the accepted keys and value types depend on the caller's own
    // field definitions, so JobsService validates this against them.
    customFields: z.record(z.string(), z.unknown()).optional()
  })
  .strict();

const updateJobSchema = createJobSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required for update'
  });

const idSchema = z.string().uuid({ message: 'Invalid job id' });

const bulkArchiveSchema = z
  .object({
    ids: z.array(idSchema).min(1).max(BULK_ARCHIVE_MAX_IDS),
    archived: z.boolean()
  })
  .strict();

@Controller('api/jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  async create(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createJobSchema)) payload: CreateJobInput
  ): Promise<Job> {
    return this.jobsService.create(user.id, payload);
  }

  @Get()
  async findAll(@CurrentUser() user: UserEntity): Promise<Job[]> {
    return this.jobsService.findAll(user.id);
  }

  /** Returns only the rows that changed; ids already in that state or not the caller's are skipped. */
  @Post('bulk-archive')
  @HttpCode(HttpStatus.OK)
  async bulkArchive(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(bulkArchiveSchema))
    payload: BulkArchiveJobsInput
  ): Promise<Job[]> {
    return this.jobsService.setArchivedMany(
      user.id,
      [...new Set(payload.ids)],
      payload.archived
    );
  }

  @Get(':id')
  async findById(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<Job> {
    const job = await this.jobsService.findById(user.id, id);
    if (!job) {
      throw new NotFoundException(apiError('JOB_NOT_FOUND', 'Job not found'));
    }

    return job;
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateJobSchema)) payload: UpdateJobInput
  ): Promise<Job> {
    const job = await this.jobsService.update(user.id, id, payload);
    if (!job) {
      throw new NotFoundException(apiError('JOB_NOT_FOUND', 'Job not found'));
    }

    return job;
  }

  @Post(':id/archive')
  async archive(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<Job> {
    const job = await this.jobsService.setArchived(user.id, id, true);
    if (!job) {
      throw new NotFoundException(apiError('JOB_NOT_FOUND', 'Job not found'));
    }

    return job;
  }

  @Post(':id/unarchive')
  async unarchive(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<Job> {
    const job = await this.jobsService.setArchived(user.id, id, false);
    if (!job) {
      throw new NotFoundException(apiError('JOB_NOT_FOUND', 'Job not found'));
    }

    return job;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<void> {
    const deleted = await this.jobsService.remove(user.id, id);
    if (!deleted) {
      throw new NotFoundException(apiError('JOB_NOT_FOUND', 'Job not found'));
    }
  }
}

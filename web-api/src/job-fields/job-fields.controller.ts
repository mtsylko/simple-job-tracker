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
import type {
  CreateJobFieldInput,
  JobFieldDefinition,
  UpdateJobFieldInput
} from '@job-tracker/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { JobFieldsService } from './job-fields.service';
import { apiError } from '../common/errors/api-error';

const jobFieldTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'date',
  'boolean',
  'select',
  'multiselect'
]);

const optionsSchema = z.array(z.string().trim().min(1)).nullable().optional();

/** select/multiselect are meaningless without choices, so require them up front. */
const requiresOptions = (value: {
  type?: z.infer<typeof jobFieldTypeSchema>;
  options?: string[] | null;
}) =>
  value.type === undefined ||
  !['select', 'multiselect'].includes(value.type) ||
  (value.options?.length ?? 0) > 0;

const createJobFieldSchema = z
  .object({
    label: z.string().trim().min(1),
    type: jobFieldTypeSchema,
    options: optionsSchema,
    required: z.boolean().optional()
  })
  .strict()
  .refine(requiresOptions, {
    message: 'options are required for select fields',
    path: ['options']
  });

/** `key` and `type` are immutable — changing either would strand stored values. */
const updateJobFieldSchema = z
  .object({
    label: z.string().trim().min(1).optional(),
    options: optionsSchema,
    required: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required for update'
  });

const reorderJobFieldsSchema = z
  .object({
    orderedIds: z.array(z.string().uuid()).min(1)
  })
  .strict();

const idSchema = z.string().uuid({ message: 'Invalid job field id' });

@Controller('api/job-fields')
@UseGuards(JwtAuthGuard)
export class JobFieldsController {
  constructor(private readonly jobFieldsService: JobFieldsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: UserEntity
  ): Promise<JobFieldDefinition[]> {
    return this.jobFieldsService.listDefinitions(user.id);
  }

  @Post()
  async create(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createJobFieldSchema))
    payload: CreateJobFieldInput
  ): Promise<JobFieldDefinition> {
    return this.jobFieldsService.create(user.id, payload);
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(reorderJobFieldsSchema))
    payload: { orderedIds: string[] }
  ): Promise<void> {
    await this.jobFieldsService.reorder(user.id, payload.orderedIds);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateJobFieldSchema))
    payload: UpdateJobFieldInput
  ): Promise<JobFieldDefinition> {
    const updated = await this.jobFieldsService.update(user.id, id, payload);
    if (!updated) {
      throw new NotFoundException(
        apiError('JOB_FIELD_NOT_FOUND', 'Job field not found')
      );
    }

    return updated;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<void> {
    const archived = await this.jobFieldsService.archive(user.id, id);
    if (!archived) {
      throw new NotFoundException(
        apiError('JOB_FIELD_NOT_FOUND', 'Job field not found')
      );
    }
  }
}

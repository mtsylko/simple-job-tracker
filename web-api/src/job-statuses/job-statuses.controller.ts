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
import { HEX_COLOR_PATTERN, type JobStatusOption } from '@job-tracker/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JobStatusesService } from './job-statuses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { apiError } from '../common/errors/api-error';

const colorSchema = z
  .string()
  .regex(HEX_COLOR_PATTERN, { message: 'color must be a #rrggbb hex value' });

const createJobStatusSchema = z
  .object({
    value: z.string().trim().min(1),
    color: colorSchema,
    showAsTab: z.boolean().optional()
  })
  .strict();

const updateJobStatusSchema = z
  .object({
    value: z.string().trim().min(1),
    color: colorSchema,
    showAsTab: z.boolean()
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required for update'
  });

const reorderJobStatusesSchema = z
  .object({
    orderedIds: z.array(z.string().uuid()).min(1)
  })
  .strict();

const idSchema = z.string().uuid({ message: 'Invalid job status id' });

@Controller('api/job-statuses')
@UseGuards(JwtAuthGuard)
export class JobStatusesController {
  constructor(private readonly jobStatusesService: JobStatusesService) {}

  @Get('options')
  async findAllOptions(
    @CurrentUser() user: UserEntity
  ): Promise<JobStatusOption[]> {
    return this.jobStatusesService.listOptions(user.id);
  }

  @Post()
  async create(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createJobStatusSchema))
    payload: z.infer<typeof createJobStatusSchema>
  ): Promise<JobStatusOption> {
    return this.jobStatusesService.create(user.id, payload);
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(reorderJobStatusesSchema))
    payload: { orderedIds: string[] }
  ): Promise<void> {
    await this.jobStatusesService.reorder(user.id, payload.orderedIds);
  }

  @Patch(':id/default')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setDefault(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<void> {
    const ok = await this.jobStatusesService.setDefault(user.id, id);
    if (!ok) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job status not found')
      );
    }
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateJobStatusSchema))
    payload: z.infer<typeof updateJobStatusSchema>
  ): Promise<JobStatusOption> {
    const updated = await this.jobStatusesService.updateOption(
      user.id,
      id,
      payload
    );
    if (!updated) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job status not found')
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
    const deleted = await this.jobStatusesService.deleteOption(user.id, id);
    if (!deleted) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job status not found')
      );
    }
  }
}

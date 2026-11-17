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
import type { JobTaxonomyOption } from '@job-tracker/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JobLevelsService } from './job-levels.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { apiError } from '../common/errors/api-error';

const createJobLevelSchema = z
  .object({
    value: z.string().trim().min(1)
  })
  .strict();

const updateJobLevelSchema = z
  .object({
    value: z.string().trim().min(1)
  })
  .strict();

const reorderJobLevelsSchema = z
  .object({
    orderedIds: z.array(z.string().uuid()).min(1)
  })
  .strict();

const idSchema = z.string().uuid({ message: 'Invalid job level id' });

@Controller('api/job-levels')
@UseGuards(JwtAuthGuard)
export class JobLevelsController {
  constructor(private readonly jobLevelsService: JobLevelsService) {}

  @Post()
  async create(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createJobLevelSchema))
    payload: { value: string }
  ): Promise<{ value: string }> {
    await this.jobLevelsService.saveValue(user.id, payload.value);
    return { value: payload.value.trim() };
  }

  @Get()
  async findAll(@CurrentUser() user: UserEntity): Promise<string[]> {
    return this.jobLevelsService.listValues(user.id);
  }

  @Get('options')
  async findAllOptions(
    @CurrentUser() user: UserEntity
  ): Promise<JobTaxonomyOption[]> {
    return this.jobLevelsService.listOptions(user.id);
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(reorderJobLevelsSchema))
    payload: { orderedIds: string[] }
  ): Promise<void> {
    await this.jobLevelsService.reorder(user.id, payload.orderedIds);
  }

  @Patch(':id/default')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setDefault(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<void> {
    const ok = await this.jobLevelsService.setDefault(user.id, id);
    if (!ok) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job level not found')
      );
    }
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateJobLevelSchema))
    payload: { value: string }
  ): Promise<JobTaxonomyOption> {
    const updated = await this.jobLevelsService.updateValue(
      user.id,
      id,
      payload.value
    );
    if (!updated) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job level not found')
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
    const deleted = await this.jobLevelsService.deleteOption(user.id, id);
    if (!deleted) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job level not found')
      );
    }
  }
}

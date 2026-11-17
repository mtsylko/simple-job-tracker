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
import { JobTypesService } from './job-types.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { apiError } from '../common/errors/api-error';

const createJobTypeSchema = z
  .object({
    value: z.string().trim().min(1)
  })
  .strict();

const updateJobTypeSchema = z
  .object({
    value: z.string().trim().min(1)
  })
  .strict();

const reorderJobTypesSchema = z
  .object({
    orderedIds: z.array(z.string().uuid()).min(1)
  })
  .strict();

const idSchema = z.string().uuid({ message: 'Invalid job type id' });

@Controller('api/job-types')
@UseGuards(JwtAuthGuard)
export class JobTypesController {
  constructor(private readonly jobTypesService: JobTypesService) {}

  @Post()
  async create(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createJobTypeSchema)) payload: { value: string }
  ): Promise<{ value: string }> {
    await this.jobTypesService.saveValue(user.id, payload.value);
    return { value: payload.value.trim() };
  }

  @Get()
  async findAll(@CurrentUser() user: UserEntity): Promise<string[]> {
    return this.jobTypesService.listValues(user.id);
  }

  @Get('options')
  async findAllOptions(
    @CurrentUser() user: UserEntity
  ): Promise<JobTaxonomyOption[]> {
    return this.jobTypesService.listOptions(user.id);
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(reorderJobTypesSchema))
    payload: { orderedIds: string[] }
  ): Promise<void> {
    await this.jobTypesService.reorder(user.id, payload.orderedIds);
  }

  @Patch(':id/default')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setDefault(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<void> {
    const ok = await this.jobTypesService.setDefault(user.id, id);
    if (!ok) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job type not found')
      );
    }
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateJobTypeSchema)) payload: { value: string }
  ): Promise<JobTaxonomyOption> {
    const updated = await this.jobTypesService.updateValue(
      user.id,
      id,
      payload.value
    );
    if (!updated) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job type not found')
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
    const deleted = await this.jobTypesService.deleteOption(user.id, id);
    if (!deleted) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job type not found')
      );
    }
  }
}

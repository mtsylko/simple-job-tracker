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
import { JobEmploymentTypesService } from './job-employment-types.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { apiError } from '../common/errors/api-error';

const createJobEmploymentTypeSchema = z
  .object({
    value: z.string().trim().min(1)
  })
  .strict();

const updateJobEmploymentTypeSchema = z
  .object({
    value: z.string().trim().min(1)
  })
  .strict();

const reorderJobEmploymentTypesSchema = z
  .object({
    orderedIds: z.array(z.string().uuid()).min(1)
  })
  .strict();

const idSchema = z.string().uuid({ message: 'Invalid job employment type id' });

@Controller('api/job-employment-types')
@UseGuards(JwtAuthGuard)
export class JobEmploymentTypesController {
  constructor(
    private readonly jobEmploymentTypesService: JobEmploymentTypesService
  ) {}

  @Post()
  async create(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createJobEmploymentTypeSchema))
    payload: { value: string }
  ): Promise<{ value: string }> {
    await this.jobEmploymentTypesService.saveValue(user.id, payload.value);
    return { value: payload.value.trim() };
  }

  @Get()
  async findAll(@CurrentUser() user: UserEntity): Promise<string[]> {
    return this.jobEmploymentTypesService.listValues(user.id);
  }

  @Get('options')
  async findAllOptions(
    @CurrentUser() user: UserEntity
  ): Promise<JobTaxonomyOption[]> {
    return this.jobEmploymentTypesService.listOptions(user.id);
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(reorderJobEmploymentTypesSchema))
    payload: { orderedIds: string[] }
  ): Promise<void> {
    await this.jobEmploymentTypesService.reorder(user.id, payload.orderedIds);
  }

  @Patch(':id/default')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setDefault(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<void> {
    const ok = await this.jobEmploymentTypesService.setDefault(user.id, id);
    if (!ok) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job employment type not found')
      );
    }
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateJobEmploymentTypeSchema))
    payload: { value: string }
  ): Promise<JobTaxonomyOption> {
    const updated = await this.jobEmploymentTypesService.updateValue(
      user.id,
      id,
      payload.value
    );
    if (!updated) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job employment type not found')
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
    const deleted = await this.jobEmploymentTypesService.deleteOption(
      user.id,
      id
    );
    if (!deleted) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job employment type not found')
      );
    }
  }
}

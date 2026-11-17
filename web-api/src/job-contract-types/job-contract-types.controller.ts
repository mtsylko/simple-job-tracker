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
import { JobContractTypesService } from './job-contract-types.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { apiError } from '../common/errors/api-error';

const createJobContractTypeSchema = z
  .object({
    value: z.string().trim().min(1)
  })
  .strict();

const updateJobContractTypeSchema = z
  .object({
    value: z.string().trim().min(1)
  })
  .strict();

const reorderJobContractTypesSchema = z
  .object({
    orderedIds: z.array(z.string().uuid()).min(1)
  })
  .strict();

const idSchema = z.string().uuid({ message: 'Invalid job contract type id' });

@Controller('api/job-contract-types')
@UseGuards(JwtAuthGuard)
export class JobContractTypesController {
  constructor(
    private readonly jobContractTypesService: JobContractTypesService
  ) {}

  @Post()
  async create(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createJobContractTypeSchema))
    payload: { value: string }
  ): Promise<{ value: string }> {
    await this.jobContractTypesService.saveValue(user.id, payload.value);
    return { value: payload.value.trim() };
  }

  @Get()
  async findAll(@CurrentUser() user: UserEntity): Promise<string[]> {
    return this.jobContractTypesService.listValues(user.id);
  }

  @Get('options')
  async findAllOptions(
    @CurrentUser() user: UserEntity
  ): Promise<JobTaxonomyOption[]> {
    return this.jobContractTypesService.listOptions(user.id);
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(reorderJobContractTypesSchema))
    payload: { orderedIds: string[] }
  ): Promise<void> {
    await this.jobContractTypesService.reorder(user.id, payload.orderedIds);
  }

  @Patch(':id/default')
  @HttpCode(HttpStatus.NO_CONTENT)
  async setDefault(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<void> {
    const ok = await this.jobContractTypesService.setDefault(user.id, id);
    if (!ok) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job contract type not found')
      );
    }
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateJobContractTypeSchema))
    payload: { value: string }
  ): Promise<JobTaxonomyOption> {
    const updated = await this.jobContractTypesService.updateValue(
      user.id,
      id,
      payload.value
    );
    if (!updated) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job contract type not found')
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
    const deleted = await this.jobContractTypesService.deleteOption(
      user.id,
      id
    );
    if (!deleted) {
      throw new NotFoundException(
        apiError('TAXONOMY_OPTION_NOT_FOUND', 'Job contract type not found')
      );
    }
  }
}

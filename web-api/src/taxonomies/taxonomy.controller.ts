import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  type Type
} from '@nestjs/common';
import { z } from 'zod';
import type { JobTaxonomyOption } from '@job-tracker/shared';
import type { UserEntity } from '../auth/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { apiError } from '../common/errors/api-error';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { TaxonomyOptionEntity } from './taxonomy-option.entity';
import type { TaxonomyService } from './taxonomy.service';

/** What the routes call on a taxonomy whose options are only a label. */
export type LabelTaxonomy = Pick<
  TaxonomyService<TaxonomyOptionEntity>,
  | 'saveValue'
  | 'listValues'
  | 'listOptions'
  | 'reorder'
  | 'setDefault'
  | 'updateValue'
  | 'deleteOption'
>;

const valueSchema = z
  .object({
    value: z.string().trim().min(1)
  })
  .strict();

const reorderSchema = z
  .object({
    orderedIds: z.array(z.string().uuid()).min(1)
  })
  .strict();

/** The routes of a label-only taxonomy; the subclass names the path with `@Controller`. */
export function taxonomyController(noun: string, service: Type<LabelTaxonomy>) {
  const idSchema = z.string().uuid({ message: `Invalid ${noun} id` });
  const notFound = () =>
    new NotFoundException(
      apiError(
        'TAXONOMY_OPTION_NOT_FOUND',
        `${noun[0].toUpperCase()}${noun.slice(1)} not found`
      )
    );

  // Declared in this order on purpose: `PATCH reorder` has to match before `PATCH :id`.
  @UseGuards(JwtAuthGuard)
  class TaxonomyController {
    constructor(@Inject(service) readonly taxonomy: LabelTaxonomy) {}

    @Post()
    async create(
      @CurrentUser() user: UserEntity,
      @Body(new ZodValidationPipe(valueSchema)) payload: { value: string }
    ): Promise<{ value: string }> {
      await this.taxonomy.saveValue(user.id, payload.value);
      return { value: payload.value.trim() };
    }

    @Get()
    async findAll(@CurrentUser() user: UserEntity): Promise<string[]> {
      return this.taxonomy.listValues(user.id);
    }

    @Get('options')
    async findAllOptions(
      @CurrentUser() user: UserEntity
    ): Promise<JobTaxonomyOption[]> {
      return this.taxonomy.listOptions(user.id);
    }

    @Patch('reorder')
    @HttpCode(HttpStatus.NO_CONTENT)
    async reorder(
      @CurrentUser() user: UserEntity,
      @Body(new ZodValidationPipe(reorderSchema))
      payload: { orderedIds: string[] }
    ): Promise<void> {
      await this.taxonomy.reorder(user.id, payload.orderedIds);
    }

    @Patch(':id/default')
    @HttpCode(HttpStatus.NO_CONTENT)
    async setDefault(
      @CurrentUser() user: UserEntity,
      @Param('id', new ZodValidationPipe(idSchema)) id: string
    ): Promise<void> {
      if (!(await this.taxonomy.setDefault(user.id, id))) {
        throw notFound();
      }
    }

    @Patch(':id')
    async update(
      @CurrentUser() user: UserEntity,
      @Param('id', new ZodValidationPipe(idSchema)) id: string,
      @Body(new ZodValidationPipe(valueSchema)) payload: { value: string }
    ): Promise<JobTaxonomyOption> {
      const updated = await this.taxonomy.updateValue(
        user.id,
        id,
        payload.value
      );
      if (!updated) {
        throw notFound();
      }
      return updated;
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
      @CurrentUser() user: UserEntity,
      @Param('id', new ZodValidationPipe(idSchema)) id: string
    ): Promise<void> {
      if (!(await this.taxonomy.deleteOption(user.id, id))) {
        throw notFound();
      }
    }
  }

  return TaxonomyController;
}

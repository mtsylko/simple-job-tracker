import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  UseGuards
} from '@nestjs/common';
import { z } from 'zod';
import {
  TRANSLATION_VALUE_MAX_LENGTH,
  UI_LANGUAGES,
  type TranslationOverride,
  type UpsertTranslationOverrideInput
} from '@job-tracker/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { apiError } from '../common/errors/api-error';
import { TranslationsService } from './translations.service';

const idSchema = z
  .string()
  .uuid({ message: 'Invalid translation override id' });

const upsertSchema = z
  .object({
    language: z.enum(UI_LANGUAGES),
    namespace: z
      .string()
      .max(64)
      .regex(/^[A-Za-z][A-Za-z0-9]*$/, { message: 'Invalid namespace' }),
    key: z
      .string()
      .max(200)
      .regex(/^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$/, {
        message: 'Invalid key'
      }),
    value: z
      .string()
      .max(TRANSLATION_VALUE_MAX_LENGTH)
      .refine((value) => value.trim().length > 0, {
        message: 'Value must not be empty'
      })
  })
  .strict();

@Controller('api/admin/translations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminTranslationsController {
  constructor(private readonly service: TranslationsService) {}

  @Get()
  list(): Promise<TranslationOverride[]> {
    return this.service.list();
  }

  @Put()
  upsert(
    @Body(new ZodValidationPipe(upsertSchema))
    payload: UpsertTranslationOverrideInput
  ): Promise<TranslationOverride> {
    return this.service.upsert(payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<void> {
    if (!(await this.service.remove(id))) {
      throw new NotFoundException(
        apiError(
          'TRANSLATION_OVERRIDE_NOT_FOUND',
          'Translation override not found'
        )
      );
    }
  }
}

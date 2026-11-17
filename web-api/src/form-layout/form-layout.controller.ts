import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import type { FormLayout, UpdateFormLayoutInput } from '@job-tracker/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { FormLayoutService } from './form-layout.service';

const MAX_SECTIONS = 50;
const MAX_FIELDS_PER_SECTION = 200;

/**
 * Ids are opaque frontend presentation keys, so they are bounded rather than
 * enumerated — the API must not need a redeploy every time the form gains a field.
 * The caps exist so a malformed client cannot grow the jsonb without limit.
 */
const fieldIdsSchema = z
  .array(z.string().trim().min(1).max(100))
  .max(MAX_FIELDS_PER_SECTION)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'Field ids must be unique within a section'
  });

const layoutSchema = z
  .record(z.string().trim().min(1).max(64), fieldIdsSchema)
  .refine((layout) => Object.keys(layout).length <= MAX_SECTIONS, {
    message: `A layout cannot have more than ${MAX_SECTIONS} sections`
  });

const updateFormLayoutSchema = z
  .object({
    layout: layoutSchema
  })
  .strict();

@Controller('api/form-layout')
@UseGuards(JwtAuthGuard)
export class FormLayoutController {
  constructor(private readonly formLayoutService: FormLayoutService) {}

  @Get()
  async get(@CurrentUser() user: UserEntity): Promise<FormLayout> {
    return this.formLayoutService.get(user.id);
  }

  @Put()
  async update(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(updateFormLayoutSchema))
    payload: UpdateFormLayoutInput
  ): Promise<FormLayout> {
    return this.formLayoutService.save(user.id, payload.layout);
  }
}

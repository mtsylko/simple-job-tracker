import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards
} from '@nestjs/common';
import { z } from 'zod';
import type { ApplyPresetInput } from '@job-tracker/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { PresetsService } from './presets.service';

const valuesSchema = z.array(z.string().trim().min(1)).max(50);

const applyPresetSchema = z
  .object({
    key: z.string().trim().min(1),
    specializations: valuesSchema,
    roles: valuesSchema,
    levels: valuesSchema,
    types: valuesSchema,
    customFields: valuesSchema
  })
  .strict();

/** The onboarding screen's two exits; either one marks the user onboarded. */
@Controller('api/presets')
@UseGuards(JwtAuthGuard)
export class PresetsController {
  constructor(private readonly presetsService: PresetsService) {}

  @Post('apply')
  @HttpCode(HttpStatus.NO_CONTENT)
  async apply(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(applyPresetSchema)) payload: ApplyPresetInput
  ): Promise<void> {
    await this.presetsService.apply(user.id, payload);
  }

  @Post('skip')
  @HttpCode(HttpStatus.NO_CONTENT)
  async skip(@CurrentUser() user: UserEntity): Promise<void> {
    await this.presetsService.markOnboarded(user.id);
  }
}

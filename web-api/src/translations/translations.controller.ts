import { Controller, Get } from '@nestjs/common';
import type { TranslationOverrideBundle } from '@job-tracker/shared';
import { TranslationsService } from './translations.service';

// Unguarded on purpose: the sign-in page shows overridden copy too, and UI text is not personal data.
@Controller('api/translations')
export class TranslationsController {
  constructor(private readonly service: TranslationsService) {}

  @Get()
  bundle(): Promise<TranslationOverrideBundle> {
    return this.service.bundle();
  }
}

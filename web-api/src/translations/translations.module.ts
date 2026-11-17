import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminTranslationsController } from './admin-translations.controller';
import { TranslationOverrideEntity } from './translation-override.entity';
import { TranslationsController } from './translations.controller';
import { TranslationsService } from './translations.service';

@Module({
  imports: [TypeOrmModule.forFeature([TranslationOverrideEntity])],
  controllers: [TranslationsController, AdminTranslationsController],
  providers: [TranslationsService]
})
export class TranslationsModule {}

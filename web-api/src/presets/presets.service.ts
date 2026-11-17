import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  findJobPreset,
  presetOffer,
  type ApplyPresetInput
} from '@job-tracker/shared';
import { JobRolesService } from '../job-roles/job-roles.service';
import { JobLevelsService } from '../job-levels/job-levels.service';
import { JobTypesService } from '../job-types/job-types.service';
import { JobFieldsService } from '../job-fields/job-fields.service';
import { UserEntity } from '../auth/user.entity';
import { apiError } from '../common/errors/api-error';

/** The shared shape of the three taxonomy services, so they seed in one loop. */
interface TaxonomyValueSeeder {
  saveValue(userId: string, rawValue: string): Promise<void>;
}

/** Keeps the offered values that the user left ticked, in the catalog's order. */
function kept(presetValues: string[], picked: string[]): string[] {
  const pickedSet = new Set(picked);
  return presetValues.filter((value) => pickedSet.has(value));
}

@Injectable()
export class PresetsService {
  constructor(
    private readonly roles: JobRolesService,
    private readonly levels: JobLevelsService,
    private readonly types: JobTypesService,
    private readonly fields: JobFieldsService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>
  ) {}

  /**
   * Seeds the values the user kept from a preset, then marks them onboarded.
   * Values outside what the picked specializations offer are ignored, so the
   * client can only narrow the preset.
   * Every step is idempotent (`saveValue` dedupes, existing field labels are
   * skipped), so a run that fails midway converges on the next try; the user is
   * marked onboarded only after the seeding succeeds.
   */
  async apply(userId: string, input: ApplyPresetInput): Promise<void> {
    const preset = findJobPreset(input.key);
    if (!preset) {
      throw new BadRequestException(
        apiError('PRESET_UNKNOWN', 'Unknown preset')
      );
    }

    const offer = presetOffer(preset, input.specializations);
    const taxonomySeeds: Array<[TaxonomyValueSeeder, string[]]> = [
      [this.roles, kept(offer.roles, input.roles)],
      [this.levels, kept(offer.levels, input.levels)],
      [this.types, kept(offer.types, input.types)]
    ];
    for (const [service, values] of taxonomySeeds) {
      for (const value of values) {
        await service.saveValue(userId, value);
      }
    }

    const pickedFields = new Set(input.customFields);
    const existingLabels = new Set(
      (await this.fields.listDefinitions(userId)).map((field) => field.label)
    );
    for (const field of offer.customFields) {
      if (!pickedFields.has(field.label) || existingLabels.has(field.label)) {
        continue;
      }
      await this.fields.create(userId, field);
    }

    await this.markOnboarded(userId);
  }

  /** Records that the user left the onboarding screen; the first time wins. */
  async markOnboarded(userId: string): Promise<void> {
    await this.users.update(
      { id: userId, onboardedAt: IsNull() },
      { onboardedAt: new Date() }
    );
  }
}

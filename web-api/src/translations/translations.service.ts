import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  TranslationOverride,
  TranslationOverrideBundle,
  UpsertTranslationOverrideInput
} from '@job-tracker/shared';
import { TranslationOverrideEntity } from './translation-override.entity';

type UpsertedRow = Omit<TranslationOverrideEntity, 'updatedAt'> & {
  updated_at: Date;
};

function toOverride(entity: TranslationOverrideEntity): TranslationOverride {
  return {
    id: entity.id,
    language: entity.language,
    namespace: entity.namespace,
    key: entity.key,
    value: entity.value,
    updatedAt: entity.updatedAt.toISOString()
  };
}

@Injectable()
export class TranslationsService {
  constructor(
    @InjectRepository(TranslationOverrideEntity)
    private readonly repo: Repository<TranslationOverrideEntity>
  ) {}

  async bundle(): Promise<TranslationOverrideBundle> {
    const rows = await this.repo.find();
    const bundle: TranslationOverrideBundle = {};
    for (const row of rows) {
      const namespaces = (bundle[row.language] ??= {});
      (namespaces[row.namespace] ??= {})[row.key] = row.value;
    }
    return bundle;
  }

  async list(): Promise<TranslationOverride[]> {
    const rows = await this.repo.find({
      order: { namespace: 'ASC', key: 'ASC', language: 'ASC' }
    });
    return rows.map(toOverride);
  }

  async upsert(
    input: UpsertTranslationOverrideInput
  ): Promise<TranslationOverride> {
    const [row] = await this.repo.query<UpsertedRow[]>(
      `INSERT INTO translation_overrides (language, namespace, key, value)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (language, namespace, key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = now()
       RETURNING id, language, namespace, key, value, updated_at`,
      [input.language, input.namespace, input.key, input.value]
    );
    return toOverride({ ...row, updatedAt: row.updated_at });
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return Boolean(result.affected);
  }
}

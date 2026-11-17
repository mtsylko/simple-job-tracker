import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm';
import type { UiLanguage } from '@job-tracker/shared';

@Entity({ name: 'translation_overrides' })
@Unique('UQ_translation_overrides_key', ['language', 'namespace', 'key'])
export class TranslationOverrideEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  language!: UiLanguage;

  @Column({ type: 'text' })
  namespace!: string;

  @Column({ type: 'text' })
  key!: string;

  @Column({ type: 'text' })
  value!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

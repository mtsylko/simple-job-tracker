import type { JobFieldType } from '@job-tracker/shared';
import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

@Entity({ name: 'job_field_definitions' })
@Unique(['userId', 'key'])
@Index(['userId'])
export class JobFieldDefinitionEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId!: string;

  /**
   * Immutable slug derived from the label on create; the jsonb key under
   * `jobs.custom_fields`. Never updated, so renaming the label keeps the data.
   */
  @Column({ type: 'text' })
  key!: string;

  @Column({ type: 'text' })
  label!: string;

  @Column({ type: 'text' })
  type!: JobFieldType;

  /** Non-null only for select/multiselect. */
  @Column({ type: 'jsonb', nullable: true })
  options!: string[] | null;

  @Column({ type: 'boolean', default: false })
  required!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  /** Soft delete: the field stops rendering and rejects writes, values are kept. */
  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

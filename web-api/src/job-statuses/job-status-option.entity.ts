import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';
import type { JobStatusColor } from '@job-tracker/shared';

@Entity({ name: 'job_statuses' })
@Unique(['userId', 'value'])
export class JobStatusOptionEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId!: string;

  @Column({ type: 'text' })
  value!: string;

  /** Accent hex (`#rrggbb`) chosen with the colour picker; the badge fill/text
   *  are derived from it on the client. */
  @Column({ type: 'text' })
  color!: JobStatusColor;

  @Column({ name: 'show_as_tab', type: 'boolean', default: false })
  showAsTab!: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  /** Soft delete: hidden from the active list, but kept so jobs that reference it
   *  still resolve their label. Unused options are hard-deleted instead. */
  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

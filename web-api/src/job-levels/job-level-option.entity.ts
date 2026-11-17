import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

@Entity({ name: 'job_levels' })
@Unique(['userId', 'value'])
export class JobLevelOptionEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId!: string;

  @Column({ type: 'text' })
  value!: string;

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

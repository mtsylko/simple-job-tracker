import type { JobCustomFields } from '@job-tracker/shared';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm';
import { JobRoleOptionEntity } from '../job-roles/job-role-option.entity';
import { JobLevelOptionEntity } from '../job-levels/job-level-option.entity';
import { JobTypeOptionEntity } from '../job-types/job-type-option.entity';
import { JobStatusOptionEntity } from '../job-statuses/job-status-option.entity';
import { JobOutcomeOptionEntity } from '../job-outcomes/job-outcome-option.entity';
import { JobEmploymentTypeOptionEntity } from '../job-employment-types/job-employment-type-option.entity';
import { JobContractTypeOptionEntity } from '../job-contract-types/job-contract-type-option.entity';

@Entity({ name: 'jobs' })
@Index(['userId'])
export class JobEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId!: string;

  @Column({ type: 'text' })
  company!: string;

  @Column({ name: 'is_product_company', type: 'boolean' })
  isProductCompany!: boolean;

  @Column({ name: 'job_post_link', type: 'text' })
  jobPostLink!: string;

  @Column({ type: 'text', nullable: true })
  location!: string | null;

  @Column({ name: 'salary_range', type: 'text', nullable: true })
  salaryRange!: string | null;

  @Column({ name: 'salary_expectations', type: 'text', nullable: true })
  salaryExpectations!: string | null;

  @Column({ name: 'applied_at', type: 'timestamptz' })
  appliedAt!: Date;

  @Column({ type: 'text' })
  cv!: string;

  // Taxonomy is referenced by id, so a rename on the option propagates here and
  // the label is resolved from these relations. RESTRICT: an option in use cannot
  // be hard-deleted — the service archives it instead.
  @ManyToOne(() => JobRoleOptionEntity, {
    onDelete: 'RESTRICT',
    nullable: true
  })
  @JoinColumn({ name: 'role_option_id' })
  roleOption!: JobRoleOptionEntity | null;

  @Column({ name: 'role_option_id', type: 'text', nullable: true })
  roleOptionId!: string | null;

  @ManyToOne(() => JobLevelOptionEntity, {
    onDelete: 'RESTRICT',
    nullable: true
  })
  @JoinColumn({ name: 'level_option_id' })
  levelOption!: JobLevelOptionEntity | null;

  @Column({ name: 'level_option_id', type: 'text', nullable: true })
  levelOptionId!: string | null;

  @ManyToOne(() => JobTypeOptionEntity, {
    onDelete: 'RESTRICT',
    nullable: true
  })
  @JoinColumn({ name: 'type_option_id' })
  typeOption!: JobTypeOptionEntity | null;

  @Column({ name: 'type_option_id', type: 'text', nullable: true })
  typeOptionId!: string | null;

  // Employment type (work-time) and contract type (legal form) are per-user
  // taxonomies referenced by id like role/level/type. Nullable: both are optional
  // and never auto-filled. RESTRICT: an option in use is archived, not deleted.
  @ManyToOne(() => JobEmploymentTypeOptionEntity, {
    onDelete: 'RESTRICT',
    nullable: true
  })
  @JoinColumn({ name: 'employment_type_option_id' })
  employmentTypeOption!: JobEmploymentTypeOptionEntity | null;

  @Column({ name: 'employment_type_option_id', type: 'text', nullable: true })
  employmentTypeOptionId!: string | null;

  @ManyToOne(() => JobContractTypeOptionEntity, {
    onDelete: 'RESTRICT',
    nullable: true
  })
  @JoinColumn({ name: 'contract_type_option_id' })
  contractTypeOption!: JobContractTypeOptionEntity | null;

  @Column({ name: 'contract_type_option_id', type: 'text', nullable: true })
  contractTypeOptionId!: string | null;

  // Status is a taxonomy referenced by id (like role/level/type): a rename on
  // the option propagates here and the label/kind/color resolve from the
  // relation. RESTRICT: a status in use is archived by the service, not deleted.
  @ManyToOne(() => JobStatusOptionEntity, {
    onDelete: 'RESTRICT',
    nullable: true
  })
  @JoinColumn({ name: 'status_option_id' })
  statusOption!: JobStatusOptionEntity | null;

  @Column({ name: 'status_option_id', type: 'text', nullable: true })
  statusOptionId!: string | null;

  // Outcome ("why the application ended") is a per-user taxonomy referenced by id,
  // like role/level/type — a rename propagates and the label resolves from the
  // relation. Nullable: outcome is optional and never auto-filled. RESTRICT: an
  // outcome in use is archived by the service, not deleted.
  @ManyToOne(() => JobOutcomeOptionEntity, {
    onDelete: 'RESTRICT',
    nullable: true
  })
  @JoinColumn({ name: 'outcome_option_id' })
  outcomeOption!: JobOutcomeOptionEntity | null;

  @Column({ name: 'outcome_option_id', type: 'text', nullable: true })
  outcomeOptionId!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'application_questions', type: 'text', nullable: true })
  applicationQuestions!: string | null;

  /** Values for user-defined fields, keyed by `JobFieldDefinitionEntity.key`. */
  @Column({
    name: 'custom_fields',
    type: 'jsonb',
    default: () => "'{}'::jsonb"
  })
  customFields!: JobCustomFields;

  /**
   * Soft archive: the row is kept and stays editable, it just drops out of the
   * default list view. Set from the row menu or by the auto-archive sweep.
   */
  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // When the status last changed, distinct from `updatedAt` (which any edit
  // bumps). Set on create and only when an update actually changes the status.
  @Column({ name: 'status_changed_at', type: 'timestamptz' })
  statusChangedAt!: Date;
}

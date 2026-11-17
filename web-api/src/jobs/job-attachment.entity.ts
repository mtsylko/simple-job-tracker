import {
  CreateDateColumn,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm';
import { JobEntity } from './job.entity';

/** A file kept with an application; stored on disk as `<id>`. */
@Entity({ name: 'job_attachments' })
@Index('IDX_job_attachments_job_id', ['jobId'])
export class JobAttachmentEntity {
  @PrimaryColumn({
    type: 'uuid',
    primaryKeyConstraintName: 'PK_job_attachments'
  })
  id!: string;

  @Column({ name: 'user_id', type: 'text' })
  userId!: string;

  @ManyToOne(() => JobEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'job_id',
    foreignKeyConstraintName: 'FK_job_attachments_job'
  })
  job!: JobEntity;

  @Column({ name: 'job_id', type: 'text' })
  jobId!: string;

  // The name it was uploaded under, given back on download.
  @Column({ name: 'file_name', type: 'text' })
  fileName!: string;

  @Column({ type: 'integer' })
  size!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

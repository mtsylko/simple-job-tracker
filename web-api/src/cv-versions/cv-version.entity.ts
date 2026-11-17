import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique
} from 'typeorm';
import { CvAttachmentEntity } from './cv-attachment.entity';

@Entity({ name: 'cv_versions' })
@Index(['userId'])
@Unique('UQ_cv_versions_attachment_id', ['attachmentId'])
export class CvVersionEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  // Keyed with user_id so a version holds only its owner's attachment; read-only, as saving null would null user_id.
  @ManyToOne(() => CvAttachmentEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn([
    {
      name: 'user_id',
      referencedColumnName: 'userId',
      foreignKeyConstraintName: 'FK_cv_versions_attachment'
    },
    { name: 'attachment_id', referencedColumnName: 'id' }
  ])
  attachment?: CvAttachmentEntity | null;

  @Column({ name: 'attachment_id', type: 'uuid', nullable: true })
  attachmentId!: string | null;

  @Column({ name: 'source_link', type: 'text', nullable: true })
  sourceLink!: string | null;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

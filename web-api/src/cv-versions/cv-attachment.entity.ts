import {
  Check,
  CreateDateColumn,
  Column,
  Entity,
  PrimaryColumn,
  Unique
} from 'typeorm';

/** A CV file: stored here and owned by its uploader, or linked from elsewhere. */
@Entity({ name: 'cv_attachments' })
// Target of the CV version foreign key, which carries the owner along with the id.
@Unique('UQ_cv_attachments_user_id', ['userId', 'id'])
@Check('CHK_cv_attachments_external_url', `"external_url" ~ '^https?://\\S+$'`)
export class CvAttachmentEntity {
  // Also the stored file's name on disk: `<id>.pdf`.
  @PrimaryColumn({
    type: 'uuid',
    primaryKeyConstraintName: 'PK_cv_attachments'
  })
  id!: string;

  @Column({ name: 'user_id', type: 'text' })
  userId!: string;

  // Where a CV hosted elsewhere lives; null means the PDF is stored here.
  @Column({ name: 'external_url', type: 'text', nullable: true })
  externalUrl!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

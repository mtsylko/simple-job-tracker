import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from 'typeorm';
import type { FeedbackKind } from '@job-tracker/shared';

@Entity({ name: 'feedback' })
@Index('IDX_feedback_user_created', ['userId', 'createdAt'])
export class FeedbackEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'text' })
  userId!: string;

  @Column({ type: 'text' })
  kind!: FeedbackKind;

  @Column({ type: 'text' })
  message!: string;

  @Column({ name: 'page_path', type: 'text', nullable: true })
  pagePath!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;
}

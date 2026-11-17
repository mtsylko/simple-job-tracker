import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { DEFAULT_USER_ROLE, type UserRole } from '@job-tracker/shared';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ name: 'display_name', type: 'text', nullable: true })
  displayName!: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  @Column({ name: 'google_id', type: 'text', unique: true, nullable: true })
  googleId!: string | null;

  @Column({ type: 'text', default: DEFAULT_USER_ROLE })
  role!: UserRole;

  /** AI extraction calls used on `aiCallDate`. */
  @Column({ name: 'ai_call_count', type: 'int', default: 0 })
  aiCallCount!: number;

  /** UTC day `aiCallCount` belongs to, as `YYYY-MM-DD`. */
  @Column({ name: 'ai_call_date', type: 'text', nullable: true })
  aiCallDate!: string | null;

  /** Set once the user picks a preset or skips it; null shows the onboarding screen. */
  @Column({ name: 'onboarded_at', type: 'timestamptz', nullable: true })
  onboardedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

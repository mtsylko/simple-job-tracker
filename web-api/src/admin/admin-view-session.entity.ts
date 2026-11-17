import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from 'typeorm';

/** One time an admin opened a user's account; also what keeps that view open, for a limited time. */
@Entity({ name: 'admin_view_sessions' })
@Index('IDX_admin_view_sessions_admin_user', ['adminId', 'userId', 'startedAt'])
export class AdminViewSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'admin_id', type: 'text' })
  adminId!: string;

  @Column({ name: 'user_id', type: 'text' })
  userId!: string;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt!: Date;

  /** When the admin pressed Exit; the guard ignores an ended session. */
  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt!: Date | null;
}

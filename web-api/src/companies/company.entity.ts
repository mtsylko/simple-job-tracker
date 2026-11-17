import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

// Jobs match a row on `name_normalized`, not by FK.
@Entity({ name: 'companies' })
@Unique('UQ_companies_user_name', ['userId', 'nameNormalized'])
export class CompanyEntity {
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'name_normalized', type: 'text' })
  nameNormalized!: string;

  @Column({ name: 'blacklisted_at', type: 'timestamptz', nullable: true })
  blacklistedAt!: Date | null;

  @Column({ name: 'blacklist_reason', type: 'text', nullable: true })
  blacklistReason!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

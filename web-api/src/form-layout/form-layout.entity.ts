import type { FormLayout } from '@job-tracker/shared';
import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * One row per user — the layout is a single document rather than a row per field,
 * because it is only ever read and written whole.
 */
@Entity({ name: 'form_layouts' })
export class FormLayoutEntity {
  @PrimaryColumn({ name: 'user_id', type: 'text' })
  userId!: string;

  @Column({ type: 'jsonb' })
  layout!: FormLayout;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

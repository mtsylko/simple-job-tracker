import { Column, Entity, Unique } from 'typeorm';
import type { JobStatusColor } from '@job-tracker/shared';
import { TaxonomyOptionEntity } from '../taxonomies/taxonomy-option.entity';

@Entity({ name: 'job_statuses' })
@Unique(['userId', 'value'])
export class JobStatusOptionEntity extends TaxonomyOptionEntity {
  /** Accent hex (`#rrggbb`) chosen with the colour picker; the badge fill/text
   *  are derived from it on the client. */
  @Column({ type: 'text' })
  color!: JobStatusColor;

  @Column({ name: 'show_as_tab', type: 'boolean', default: false })
  showAsTab!: boolean;
}

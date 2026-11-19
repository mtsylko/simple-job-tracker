import { Entity, Unique } from 'typeorm';
import { TaxonomyOptionEntity } from '../taxonomies/taxonomy-option.entity';

@Entity({ name: 'job_outcomes' })
@Unique(['userId', 'value'])
export class JobOutcomeOptionEntity extends TaxonomyOptionEntity {}

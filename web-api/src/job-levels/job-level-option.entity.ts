import { Entity, Unique } from 'typeorm';
import { TaxonomyOptionEntity } from '../taxonomies/taxonomy-option.entity';

@Entity({ name: 'job_levels' })
@Unique(['userId', 'value'])
export class JobLevelOptionEntity extends TaxonomyOptionEntity {}

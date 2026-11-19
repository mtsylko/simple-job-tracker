import { Entity, Unique } from 'typeorm';
import { TaxonomyOptionEntity } from '../taxonomies/taxonomy-option.entity';

@Entity({ name: 'job_employment_types' })
@Unique(['userId', 'value'])
export class JobEmploymentTypeOptionEntity extends TaxonomyOptionEntity {}

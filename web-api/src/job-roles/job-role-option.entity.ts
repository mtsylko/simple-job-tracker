import { Entity, Unique } from 'typeorm';
import { TaxonomyOptionEntity } from '../taxonomies/taxonomy-option.entity';

@Entity({ name: 'job_roles' })
@Unique(['userId', 'value'])
export class JobRoleOptionEntity extends TaxonomyOptionEntity {}

import { Entity, Unique } from 'typeorm';
import { TaxonomyOptionEntity } from '../taxonomies/taxonomy-option.entity';

@Entity({ name: 'job_contract_types' })
@Unique(['userId', 'value'])
export class JobContractTypeOptionEntity extends TaxonomyOptionEntity {}

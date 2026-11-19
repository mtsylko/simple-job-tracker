import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BUILT_IN_CONTRACT_TYPES } from '@job-tracker/shared';
import { JobEntity } from '../jobs/job.entity';
import { TaxonomyService } from '../taxonomies/taxonomy.service';
import { JobContractTypeOptionEntity } from './job-contract-type-option.entity';

@Injectable()
export class JobContractTypesService extends TaxonomyService<JobContractTypeOptionEntity> {
  constructor(
    @InjectRepository(JobContractTypeOptionEntity)
    repository: Repository<JobContractTypeOptionEntity>,
    @InjectRepository(JobEntity)
    jobRepository: Repository<JobEntity>
  ) {
    super(
      repository,
      jobRepository,
      'contractTypeOptionId',
      BUILT_IN_CONTRACT_TYPES.map((value) => ({ value }))
    );
  }
}

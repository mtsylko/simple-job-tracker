import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BUILT_IN_EMPLOYMENT_TYPES } from '@job-tracker/shared';
import { JobEntity } from '../jobs/job.entity';
import { TaxonomyService } from '../taxonomies/taxonomy.service';
import { JobEmploymentTypeOptionEntity } from './job-employment-type-option.entity';

@Injectable()
export class JobEmploymentTypesService extends TaxonomyService<JobEmploymentTypeOptionEntity> {
  constructor(
    @InjectRepository(JobEmploymentTypeOptionEntity)
    repository: Repository<JobEmploymentTypeOptionEntity>,
    @InjectRepository(JobEntity)
    jobRepository: Repository<JobEntity>
  ) {
    super(
      repository,
      jobRepository,
      'employmentTypeOptionId',
      BUILT_IN_EMPLOYMENT_TYPES.map((value) => ({ value }))
    );
  }
}

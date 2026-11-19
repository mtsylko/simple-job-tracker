import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BUILT_IN_JOB_OUTCOMES } from '@job-tracker/shared';
import { JobEntity } from '../jobs/job.entity';
import { TaxonomyService } from '../taxonomies/taxonomy.service';
import { JobOutcomeOptionEntity } from './job-outcome-option.entity';

@Injectable()
export class JobOutcomesService extends TaxonomyService<JobOutcomeOptionEntity> {
  constructor(
    @InjectRepository(JobOutcomeOptionEntity)
    repository: Repository<JobOutcomeOptionEntity>,
    @InjectRepository(JobEntity)
    jobRepository: Repository<JobEntity>
  ) {
    super(
      repository,
      jobRepository,
      'outcomeOptionId',
      BUILT_IN_JOB_OUTCOMES.map((value) => ({ value }))
    );
  }
}

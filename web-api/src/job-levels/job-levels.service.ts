import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity } from '../jobs/job.entity';
import { TaxonomyService } from '../taxonomies/taxonomy.service';
import { JobLevelOptionEntity } from './job-level-option.entity';

@Injectable()
export class JobLevelsService extends TaxonomyService<JobLevelOptionEntity> {
  constructor(
    @InjectRepository(JobLevelOptionEntity)
    repository: Repository<JobLevelOptionEntity>,
    @InjectRepository(JobEntity)
    jobRepository: Repository<JobEntity>
  ) {
    super(repository, jobRepository, 'levelOptionId');
  }
}

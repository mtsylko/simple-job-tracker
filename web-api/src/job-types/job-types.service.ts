import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity } from '../jobs/job.entity';
import { TaxonomyService } from '../taxonomies/taxonomy.service';
import { JobTypeOptionEntity } from './job-type-option.entity';

@Injectable()
export class JobTypesService extends TaxonomyService<JobTypeOptionEntity> {
  constructor(
    @InjectRepository(JobTypeOptionEntity)
    repository: Repository<JobTypeOptionEntity>,
    @InjectRepository(JobEntity)
    jobRepository: Repository<JobEntity>
  ) {
    super(repository, jobRepository, 'typeOptionId');
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity } from '../jobs/job.entity';
import { TaxonomyService } from '../taxonomies/taxonomy.service';
import { JobRoleOptionEntity } from './job-role-option.entity';

@Injectable()
export class JobRolesService extends TaxonomyService<JobRoleOptionEntity> {
  constructor(
    @InjectRepository(JobRoleOptionEntity)
    repository: Repository<JobRoleOptionEntity>,
    @InjectRepository(JobEntity)
    jobRepository: Repository<JobEntity>
  ) {
    super(repository, jobRepository, 'roleOptionId');
  }
}

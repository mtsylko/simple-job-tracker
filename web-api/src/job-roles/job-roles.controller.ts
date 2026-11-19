import { Controller } from '@nestjs/common';
import { taxonomyController } from '../taxonomies/taxonomy.controller';
import { JobRolesService } from './job-roles.service';

@Controller('api/job-roles')
export class JobRolesController extends taxonomyController(
  'job role',
  JobRolesService
) {}

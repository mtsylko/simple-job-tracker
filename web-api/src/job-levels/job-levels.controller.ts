import { Controller } from '@nestjs/common';
import { taxonomyController } from '../taxonomies/taxonomy.controller';
import { JobLevelsService } from './job-levels.service';

@Controller('api/job-levels')
export class JobLevelsController extends taxonomyController(
  'job level',
  JobLevelsService
) {}

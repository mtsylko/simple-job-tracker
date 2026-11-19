import { Controller } from '@nestjs/common';
import { taxonomyController } from '../taxonomies/taxonomy.controller';
import { JobOutcomesService } from './job-outcomes.service';

@Controller('api/job-outcomes')
export class JobOutcomesController extends taxonomyController(
  'job outcome',
  JobOutcomesService
) {}

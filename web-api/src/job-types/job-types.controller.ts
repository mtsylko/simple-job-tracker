import { Controller } from '@nestjs/common';
import { taxonomyController } from '../taxonomies/taxonomy.controller';
import { JobTypesService } from './job-types.service';

@Controller('api/job-types')
export class JobTypesController extends taxonomyController(
  'job type',
  JobTypesService
) {}

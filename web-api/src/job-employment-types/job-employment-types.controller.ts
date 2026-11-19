import { Controller } from '@nestjs/common';
import { taxonomyController } from '../taxonomies/taxonomy.controller';
import { JobEmploymentTypesService } from './job-employment-types.service';

@Controller('api/job-employment-types')
export class JobEmploymentTypesController extends taxonomyController(
  'job employment type',
  JobEmploymentTypesService
) {}

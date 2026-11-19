import { Controller } from '@nestjs/common';
import { taxonomyController } from '../taxonomies/taxonomy.controller';
import { JobContractTypesService } from './job-contract-types.service';

@Controller('api/job-contract-types')
export class JobContractTypesController extends taxonomyController(
  'job contract type',
  JobContractTypesService
) {}

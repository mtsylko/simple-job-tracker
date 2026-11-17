import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '../jobs/job.entity';
import { JobEmploymentTypesController } from './job-employment-types.controller';
import { JobEmploymentTypeOptionEntity } from './job-employment-type-option.entity';
import { JobEmploymentTypesService } from './job-employment-types.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEmploymentTypeOptionEntity, JobEntity])
  ],
  controllers: [JobEmploymentTypesController],
  providers: [JobEmploymentTypesService],
  exports: [JobEmploymentTypesService]
})
export class JobEmploymentTypesModule {}

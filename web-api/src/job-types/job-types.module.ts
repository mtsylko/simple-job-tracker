import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '../jobs/job.entity';
import { JobTypesController } from './job-types.controller';
import { JobTypeOptionEntity } from './job-type-option.entity';
import { JobTypesService } from './job-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobTypeOptionEntity, JobEntity])],
  controllers: [JobTypesController],
  providers: [JobTypesService],
  exports: [JobTypesService]
})
export class JobTypesModule {}

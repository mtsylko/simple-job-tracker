import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '../jobs/job.entity';
import { JobOutcomesController } from './job-outcomes.controller';
import { JobOutcomeOptionEntity } from './job-outcome-option.entity';
import { JobOutcomesService } from './job-outcomes.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobOutcomeOptionEntity, JobEntity])],
  controllers: [JobOutcomesController],
  providers: [JobOutcomesService],
  exports: [JobOutcomesService]
})
export class JobOutcomesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '../jobs/job.entity';
import { JobStatusesController } from './job-statuses.controller';
import { JobStatusOptionEntity } from './job-status-option.entity';
import { JobStatusesService } from './job-statuses.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobStatusOptionEntity, JobEntity])],
  controllers: [JobStatusesController],
  providers: [JobStatusesService],
  exports: [JobStatusesService]
})
export class JobStatusesModule {}

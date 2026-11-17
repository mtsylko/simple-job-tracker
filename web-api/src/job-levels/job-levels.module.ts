import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '../jobs/job.entity';
import { JobLevelsController } from './job-levels.controller';
import { JobLevelOptionEntity } from './job-level-option.entity';
import { JobLevelsService } from './job-levels.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobLevelOptionEntity, JobEntity])],
  controllers: [JobLevelsController],
  providers: [JobLevelsService],
  exports: [JobLevelsService]
})
export class JobLevelsModule {}

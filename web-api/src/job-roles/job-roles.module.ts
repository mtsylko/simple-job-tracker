import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '../jobs/job.entity';
import { JobRolesController } from './job-roles.controller';
import { JobRoleOptionEntity } from './job-role-option.entity';
import { JobRolesService } from './job-roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobRoleOptionEntity, JobEntity])],
  controllers: [JobRolesController],
  providers: [JobRolesService],
  exports: [JobRolesService]
})
export class JobRolesModule {}

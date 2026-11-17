import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs.controller';
import { JobEntity } from './job.entity';
import { JobAttachmentEntity } from './job-attachment.entity';
import { JobAttachmentFiles } from './job-attachment-files';
import { JobAttachmentsController } from './job-attachments.controller';
import { JobAttachmentsService } from './job-attachments.service';
import { JobAttachmentsSweepScheduler } from './job-attachments-sweep.scheduler';
import { JobsArchiveScheduler } from './jobs-archive.scheduler';
import { JobsService } from './jobs.service';
import { JobFieldsModule } from '../job-fields/job-fields.module';
import { JobRolesModule } from '../job-roles/job-roles.module';
import { JobLevelsModule } from '../job-levels/job-levels.module';
import { JobTypesModule } from '../job-types/job-types.module';
import { JobEmploymentTypesModule } from '../job-employment-types/job-employment-types.module';
import { JobContractTypesModule } from '../job-contract-types/job-contract-types.module';
import { JobStatusesModule } from '../job-statuses/job-statuses.module';
import { JobOutcomesModule } from '../job-outcomes/job-outcomes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity, JobAttachmentEntity]),
    JobFieldsModule,
    JobRolesModule,
    JobLevelsModule,
    JobTypesModule,
    JobEmploymentTypesModule,
    JobContractTypesModule,
    JobStatusesModule,
    JobOutcomesModule
  ],
  controllers: [JobsController, JobAttachmentsController],
  providers: [
    JobsService,
    JobsArchiveScheduler,
    JobAttachmentFiles,
    JobAttachmentsService,
    JobAttachmentsSweepScheduler
  ],
  // `mail` matches a message against the applications this service reads.
  // `account` removes a deleted user's attachment files.
  exports: [JobsService, JobAttachmentFiles]
})
export class JobsModule {}

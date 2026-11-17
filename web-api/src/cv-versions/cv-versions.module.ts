import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CvVersionsController } from './cv-versions.controller';
import { CvAttachmentsController } from './cv-attachments.controller';
import { CvAttachmentsSweepScheduler } from './cv-attachments-sweep.scheduler';
import { CvAttachmentFiles } from './cv-attachment-files';
import { CvAttachmentEntity } from './cv-attachment.entity';
import { CvVersionEntity } from './cv-version.entity';
import { CvVersionsService } from './cv-versions.service';

@Module({
  imports: [TypeOrmModule.forFeature([CvVersionEntity, CvAttachmentEntity])],
  controllers: [CvVersionsController, CvAttachmentsController],
  providers: [
    CvVersionsService,
    CvAttachmentFiles,
    CvAttachmentsSweepScheduler
  ],
  exports: [CvAttachmentFiles]
})
export class CvVersionsModule {}

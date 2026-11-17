import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { JobAttachmentsService } from './job-attachments.service';

// Older than any upload still waiting on its row.
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

/** Nightly removal of attachment files whose row is gone. */
@Injectable()
export class JobAttachmentsSweepScheduler {
  private readonly logger = new Logger(JobAttachmentsSweepScheduler.name);

  constructor(private readonly attachments: JobAttachmentsService) {}

  @Cron('45 3 * * *')
  async sweepOrphans(): Promise<void> {
    try {
      const removed = await this.attachments.removeOrphanedFiles(
        new Date(Date.now() - ORPHAN_AGE_MS)
      );
      if (removed > 0) {
        this.logger.log(`Removed ${removed} orphaned job attachments`);
      }
    } catch (error) {
      this.logger.error('Job attachment sweep failed', error);
    }
  }
}

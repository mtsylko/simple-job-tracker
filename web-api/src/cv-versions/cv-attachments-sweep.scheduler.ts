import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { CvVersionsService } from './cv-versions.service';

// An upload is unclaimed only while its form is open; a day is far past that.
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

/** Nightly removal of uploaded PDFs that no CV version points at. */
@Injectable()
export class CvAttachmentsSweepScheduler {
  private readonly logger = new Logger(CvAttachmentsSweepScheduler.name);

  constructor(private readonly cvVersionsService: CvVersionsService) {}

  @Cron('30 3 * * *')
  async sweepOrphans(): Promise<void> {
    try {
      const removed = await this.cvVersionsService.removeOrphanedAttachments(
        new Date(Date.now() - ORPHAN_AGE_MS)
      );
      if (removed > 0) {
        this.logger.log(`Removed ${removed} orphaned CV attachments`);
      }
    } catch (error) {
      this.logger.error('CV attachment sweep failed', error);
    }
  }
}

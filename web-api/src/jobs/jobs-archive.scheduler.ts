import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { JobsService } from './jobs.service';

/**
 * Runs the auto-archive sweep every night, off the request path. The statement
 * is idempotent, so a second instance running it too would simply archive
 * nothing.
 */
@Injectable()
export class JobsArchiveScheduler {
  private readonly logger = new Logger(JobsArchiveScheduler.name);

  constructor(private readonly jobsService: JobsService) {}

  @Cron('0 3 * * *')
  async sweepArchive(): Promise<void> {
    try {
      const archived = await this.jobsService.runAutoArchive();
      if (archived > 0) {
        this.logger.log(`Auto-archived ${archived} applications`);
      }
    } catch (error) {
      // Logged, not rethrown: nothing awaits this call, and the next run is a
      // day away.
      this.logger.error('Auto-archive sweep failed', error);
    }
  }
}

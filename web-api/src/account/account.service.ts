import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull } from 'typeorm';
import { UserEntity } from '../auth/user.entity';
import { CvAttachmentFiles } from '../cv-versions/cv-attachment-files';
import { CvAttachmentEntity } from '../cv-versions/cv-attachment.entity';
import { JobAttachmentFiles } from '../jobs/job-attachment-files';
import { JobAttachmentEntity } from '../jobs/job-attachment.entity';
import { USER_OWNED_ENTITIES } from './user-owned-entities';

export interface AccountExport {
  exportedAt: string;
  user: UserEntity | null;
  /** Rows per table, keyed by table name. */
  tables: Record<string, unknown[]>;
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly cvFiles: CvAttachmentFiles,
    private readonly jobFiles: JobAttachmentFiles
  ) {}

  async export(userId: string): Promise<AccountExport> {
    const manager = this.dataSource.manager;
    const tables: Record<string, unknown[]> = {};

    for (const entity of USER_OWNED_ENTITIES) {
      const { tableName } = this.dataSource.getMetadata(entity);
      tables[tableName] = await manager.find(entity, { where: { userId } });
    }

    return {
      exportedAt: new Date().toISOString(),
      user: await manager.findOneBy(UserEntity, { id: userId }),
      tables
    };
  }

  /** Deletes every row the user owns in one transaction, then their stored files. */
  async delete(userId: string): Promise<void> {
    const stored = await this.dataSource.transaction(async (manager) => {
      const cvs = await manager.find(CvAttachmentEntity, {
        select: { id: true },
        where: { userId, externalUrl: IsNull() }
      });
      const jobAttachments = await manager.find(JobAttachmentEntity, {
        select: { id: true },
        where: { userId }
      });

      for (const entity of USER_OWNED_ENTITIES) {
        await manager.delete(entity, { userId });
      }
      await manager.delete(UserEntity, { id: userId });

      return {
        cvIds: cvs.map(({ id }) => id),
        jobAttachmentIds: jobAttachments.map(({ id }) => id)
      };
    });

    // The rows are gone either way; a file left behind is taken by the nightly sweep.
    await this.removeFiles('CV file', stored.cvIds, (id) =>
      this.cvFiles.remove(id)
    );
    await this.removeFiles(
      'Job attachment file',
      stored.jobAttachmentIds,
      (id) => this.jobFiles.remove(id)
    );
  }

  private async removeFiles(
    label: string,
    ids: string[],
    remove: (id: string) => Promise<void>
  ): Promise<void> {
    for (const id of ids) {
      try {
        await remove(id);
      } catch (error) {
        this.logger.warn(
          `${label} ${id} was not removed: ${(error as Error).message}`
        );
      }
    }
  }
}

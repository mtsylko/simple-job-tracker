import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { In, Repository } from 'typeorm';
import {
  JOB_ATTACHMENT_MAX_PER_JOB,
  JOB_ATTACHMENT_TYPES,
  type JobAttachment
} from '@job-tracker/shared';
import { apiError } from '../common/errors/api-error';
import { JobAttachmentEntity } from './job-attachment.entity';
import { JobAttachmentFiles } from './job-attachment-files';
import { JobEntity } from './job.entity';

export type StoredJobAttachment = {
  absolutePath: string;
  fileName: string;
  contentType: string;
};

const MAX_FILE_NAME_LENGTH = 200;

// Control characters and path separators never reach the stored name.
function cleanFileName(name: string): string {
  const cleaned = path
    .basename(name.replace(/\\/g, '/'))
    .replace(/[\p{Cc}"]/gu, '')
    .trim();
  if (!cleaned) return 'attachment';

  // Trim the stem by code point so the extension and surrogate pairs survive.
  const chars = Array.from(cleaned);
  if (chars.length <= MAX_FILE_NAME_LENGTH) return cleaned;
  const ext = Array.from(path.extname(cleaned)).slice(0, 16);
  const stem = chars
    .slice(0, MAX_FILE_NAME_LENGTH - ext.length)
    .join('')
    .trimEnd();
  return `${stem}${ext.join('')}`;
}

function contentTypeOf(fileName: string): string | null {
  return JOB_ATTACHMENT_TYPES[path.extname(fileName).toLowerCase()] ?? null;
}

function jobNotFound(): NotFoundException {
  return new NotFoundException(apiError('JOB_NOT_FOUND', 'Job not found'));
}

/** Files kept with an application, readable and writable by its owner only. */
@Injectable()
export class JobAttachmentsService {
  private readonly logger = new Logger(JobAttachmentsService.name);

  constructor(
    @InjectRepository(JobAttachmentEntity)
    private readonly attachments: Repository<JobAttachmentEntity>,
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    private readonly files: JobAttachmentFiles
  ) {}

  async list(userId: string, jobId: string): Promise<JobAttachment[]> {
    await this.assertJobOwned(userId, jobId);
    const rows = await this.attachments.find({
      where: { userId, jobId },
      order: { createdAt: 'ASC' }
    });
    return rows.map((row) => this.toAttachment(row));
  }

  async add(
    userId: string,
    jobId: string,
    upload: { originalName: string; buffer: Buffer }
  ): Promise<JobAttachment> {
    const fileName = cleanFileName(upload.originalName);
    if (!contentTypeOf(fileName)) {
      throw new BadRequestException(
        apiError('JOB_ATTACHMENT_UNSUPPORTED', 'Unsupported file type')
      );
    }

    // Cheap early answer, so a full job is refused before the file hits the disk.
    await this.assertJobOwned(userId, jobId);
    await this.assertBelowLimit(this.attachments, userId, jobId);

    const id = randomUUID();
    await this.files.write(id, upload.buffer);
    try {
      // The job row lock serializes concurrent uploads, so the recount is exact.
      const row = await this.attachments.manager.transaction(
        async (manager) => {
          const job = await manager.getRepository(JobEntity).findOne({
            select: { id: true },
            where: { id: jobId, userId },
            lock: { mode: 'pessimistic_write' }
          });
          if (!job) throw jobNotFound();

          const attachments = manager.getRepository(JobAttachmentEntity);
          await this.assertBelowLimit(attachments, userId, jobId);
          return attachments.save(
            attachments.create({
              id,
              userId,
              jobId,
              fileName,
              size: upload.buffer.length
            })
          );
        }
      );
      return this.toAttachment(row);
    } catch (error) {
      await this.removeFile(id);
      throw error;
    }
  }

  private async assertBelowLimit(
    attachments: Repository<JobAttachmentEntity>,
    userId: string,
    jobId: string
  ): Promise<void> {
    const count = await attachments.count({ where: { userId, jobId } });
    if (count >= JOB_ATTACHMENT_MAX_PER_JOB) {
      throw new BadRequestException(
        apiError(
          'JOB_ATTACHMENT_LIMIT_REACHED',
          `An application holds at most ${JOB_ATTACHMENT_MAX_PER_JOB} attachments`,
          { limit: JOB_ATTACHMENT_MAX_PER_JOB }
        )
      );
    }
  }

  async findFile(
    userId: string,
    jobId: string,
    id: string
  ): Promise<StoredJobAttachment | null> {
    const row = await this.attachments.findOne({
      where: { id, userId, jobId }
    });
    if (!row) return null;
    return {
      absolutePath: this.files.absolutePath(row.id),
      fileName: row.fileName,
      contentType: contentTypeOf(row.fileName) ?? 'application/octet-stream'
    };
  }

  async remove(userId: string, jobId: string, id: string): Promise<boolean> {
    const result = await this.attachments.delete({ id, userId, jobId });
    if (result.affected !== 1) return false;
    await this.removeFile(id);
    return true;
  }

  /** Ids of a job's attachments, read before the job's delete cascades their rows away. */
  async idsForJob(userId: string, jobId: string): Promise<string[]> {
    const rows = await this.attachments.find({
      select: { id: true },
      where: { userId, jobId }
    });
    return rows.map((row) => row.id);
  }

  async removeFiles(ids: string[]): Promise<void> {
    for (const id of ids) await this.removeFile(id);
  }

  /** Deletes files older than `cutoff` that no row points at. */
  async removeOrphanedFiles(cutoff: Date): Promise<number> {
    const candidates = await this.files.listWrittenBefore(cutoff);
    if (candidates.length === 0) return 0;

    const kept = new Set(
      (
        await this.attachments.find({
          select: { id: true },
          where: { id: In(candidates) }
        })
      ).map((row) => row.id)
    );
    const orphans = candidates.filter((id) => !kept.has(id));
    await this.removeFiles(orphans);
    return orphans.length;
  }

  private async assertJobOwned(userId: string, jobId: string): Promise<void> {
    const owned = await this.jobs.exists({ where: { id: jobId, userId } });
    if (!owned) throw jobNotFound();
  }

  // A file left behind is picked up by the nightly sweep.
  private async removeFile(id: string): Promise<void> {
    try {
      await this.files.remove(id);
    } catch (error) {
      this.logger.error(`Could not remove job attachment ${id}`, error);
    }
  }

  private toAttachment(row: JobAttachmentEntity): JobAttachment {
    return {
      id: row.id,
      fileName: row.fileName,
      size: row.size,
      createdAt: row.createdAt.toISOString()
    };
  }
}

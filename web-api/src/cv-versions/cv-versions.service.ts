import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Any, EntityManager, IsNull, Repository } from 'typeorm';
import type {
  CreateCvVersionInput,
  UpdateCvVersionInput
} from '@job-tracker/shared';
import { CvAttachmentEntity } from './cv-attachment.entity';
import { CvVersionEntity } from './cv-version.entity';
import {
  CV_ATTACHMENT_PREFIX,
  CvAttachmentFiles,
  cvAttachmentIdFromPath,
  cvAttachmentPath
} from './cv-attachment-files';
import { apiError } from '../common/errors/api-error';

export type CvVersion = {
  _id: string;
  name: string;
  description: string | null;
  attachment: string | null;
  sourceLink: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Stricter than CHK_cv_attachments_external_url, so a link it accepts never trips the CHECK.
const EXTERNAL_URL = /^https?:\/\/[^\s\p{Cc}]+$/u;

@Injectable()
export class CvVersionsService {
  private readonly logger = new Logger(CvVersionsService.name);

  constructor(
    @InjectRepository(CvVersionEntity)
    private readonly repository: Repository<CvVersionEntity>,
    @InjectRepository(CvAttachmentEntity)
    private readonly attachments: Repository<CvAttachmentEntity>,
    private readonly files: CvAttachmentFiles
  ) {}

  /** Stores the PDF and records the uploader as its owner. */
  async saveAttachment(userId: string, buffer: Buffer): Promise<string> {
    const id = randomUUID();
    await this.files.write(id, buffer);
    // A file left without its row by a failed insert goes in the nightly sweep.
    await this.attachments.insert({ id, userId });
    return cvAttachmentPath(id);
  }

  /** Where a stored PDF lives on disk, for its uploader only. */
  async findOwnedAttachment(
    userId: string,
    id: string
  ): Promise<string | null> {
    const owned = await this.attachments.exists({
      where: { id, userId, externalUrl: IsNull() }
    });
    return owned ? this.files.absolutePath(id) : null;
  }

  /** Deletes uploads older than `cutoff` that no version holds, and files on disk with no row. */
  async removeOrphanedAttachments(cutoff: Date): Promise<number> {
    // SKIP LOCKED passes over an upload a version is claiming right now (see resolveAttachment).
    const { raw } = await this.attachments
      .createQueryBuilder()
      .delete()
      .where(
        `"id" IN (SELECT "unclaimed"."id" FROM "cv_attachments" AS "unclaimed" WHERE "unclaimed"."created_at" < :cutoff AND NOT EXISTS (SELECT 1 FROM "cv_versions" WHERE "cv_versions"."attachment_id" = "unclaimed"."id") FOR UPDATE SKIP LOCKED)`,
        { cutoff }
      )
      // Property names: TypeORM silently drops a returning name it can't resolve.
      .returning(['id', 'externalUrl'])
      .execute();
    const unclaimed = (raw as { id: string; external_url: string | null }[])
      .filter((row) => row.external_url === null)
      .map((row) => row.id);

    const stale = await this.files.listWrittenBefore(cutoff);
    const known =
      stale.length === 0
        ? []
        : await this.attachments.find({
            select: { id: true },
            // One array parameter: In() binds one per id, and Postgres caps those at 65,535.
            where: { id: Any(stale) }
          });
    const knownIds = new Set(known.map((row) => row.id));

    let removed = 0;
    for (const id of new Set([
      ...unclaimed,
      ...stale.filter((id) => !knownIds.has(id))
    ])) {
      if (await this.removeFile(id)) {
        removed += 1;
      }
    }

    return removed;
  }

  // An upload must be the user's own and on no other version; a link gets a row of its own.
  private async resolveAttachment(
    manager: EntityManager,
    userId: string,
    value: string | null
  ): Promise<CvAttachmentEntity | null> {
    if (value === null) {
      return null;
    }

    if (!value.startsWith(CV_ATTACHMENT_PREFIX)) {
      if (!EXTERNAL_URL.test(value)) {
        throw new BadRequestException(
          apiError(
            'CV_ATTACHMENT_INVALID',
            'Attachment must be an uploaded PDF or a link'
          )
        );
      }

      const link = manager.create(CvAttachmentEntity, {
        id: randomUUID(),
        userId,
        externalUrl: value
      });
      await manager.insert(CvAttachmentEntity, link);
      return link;
    }

    const id = cvAttachmentIdFromPath(value);
    // Held until commit, so a second claim waits and then sees this one.
    const upload = id
      ? await manager.findOne(CvAttachmentEntity, {
          where: { id, userId, externalUrl: IsNull() },
          lock: { mode: 'pessimistic_write' }
        })
      : null;
    if (!upload) {
      throw new BadRequestException(
        apiError(
          'CV_ATTACHMENT_MISSING',
          'Attachment not found — upload the file again'
        )
      );
    }

    if (
      await manager.exists(CvVersionEntity, {
        where: { attachmentId: upload.id }
      })
    ) {
      throw new BadRequestException(
        apiError(
          'CV_ATTACHMENT_IN_USE',
          'Attachment is already on another CV version — upload the file again'
        )
      );
    }

    return upload;
  }

  private async removeStoredFile(
    attachment: CvAttachmentEntity | null
  ): Promise<void> {
    if (attachment && attachment.externalUrl === null) {
      await this.removeFile(attachment.id);
    }
  }

  // Logged, not thrown: the row is already gone, so the nightly sweep retries the file.
  private async removeFile(id: string): Promise<boolean> {
    try {
      await this.files.remove(id);
      return true;
    } catch (error) {
      this.logger.error(`Could not remove CV attachment ${id}`, error);
      return false;
    }
  }

  private async findAttachment(
    manager: EntityManager,
    id: string | null
  ): Promise<CvAttachmentEntity | null> {
    return id ? manager.findOne(CvAttachmentEntity, { where: { id } }) : null;
  }

  // Locked, so a concurrent edit or delete of the same version waits for this one.
  private async findOwnRowForWrite(
    manager: EntityManager,
    userId: string,
    id: string
  ): Promise<CvVersionEntity | null> {
    return manager.findOne(CvVersionEntity, {
      where: { id, userId },
      lock: { mode: 'pessimistic_write' }
    });
  }

  private normalizeNullable(value: string | null | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private locationOf(attachment: CvAttachmentEntity | null): string | null {
    if (!attachment) {
      return null;
    }

    return attachment.externalUrl ?? cvAttachmentPath(attachment.id);
  }

  private mapEntityToCvVersion(
    entity: CvVersionEntity,
    attachment: CvAttachmentEntity | null
  ): CvVersion {
    return {
      _id: entity.id,
      name: entity.name,
      description: entity.description,
      attachment: this.locationOf(attachment),
      sourceLink: entity.sourceLink,
      enabled: entity.enabled,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  async create(
    userId: string,
    input: CreateCvVersionInput
  ): Promise<CvVersion> {
    const now = new Date();
    const { saved, attachment } = await this.repository.manager.transaction(
      async (manager) => {
        const attachment = await this.resolveAttachment(
          manager,
          userId,
          this.normalizeNullable(input.attachment)
        );
        const entity = manager.create(CvVersionEntity, {
          id: randomUUID(),
          userId,
          name: input.name.trim(),
          description: this.normalizeNullable(input.description),
          attachmentId: attachment?.id ?? null,
          sourceLink: this.normalizeNullable(input.sourceLink),
          enabled: input.enabled ?? true,
          createdAt: now,
          updatedAt: now
        });
        return { saved: await manager.save(entity), attachment };
      }
    );

    return this.mapEntityToCvVersion(saved, attachment);
  }

  async findAll(userId: string): Promise<CvVersion[]> {
    const rows = await this.repository.find({
      where: { userId },
      relations: { attachment: true },
      order: { createdAt: 'DESC' }
    });
    return rows.map((row) =>
      this.mapEntityToCvVersion(row, row.attachment ?? null)
    );
  }

  async findById(userId: string, id: string): Promise<CvVersion | null> {
    const row = await this.repository.findOne({
      where: { id, userId },
      relations: { attachment: true }
    });
    if (!row) {
      return null;
    }

    return this.mapEntityToCvVersion(row, row.attachment ?? null);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateCvVersionInput
  ): Promise<CvVersion | null> {
    const result = await this.repository.manager.transaction(
      async (manager) => {
        const row = await this.findOwnRowForWrite(manager, userId, id);
        if (!row) {
          return null;
        }

        if (input.name !== undefined) {
          row.name = input.name.trim();
        }

        if (input.description !== undefined) {
          row.description = this.normalizeNullable(input.description);
        }

        if (input.sourceLink !== undefined) {
          row.sourceLink = this.normalizeNullable(input.sourceLink);
        }

        if (input.enabled !== undefined) {
          row.enabled = input.enabled ?? true;
        }

        row.updatedAt = new Date();
        const previous = await this.findAttachment(manager, row.attachmentId);
        const requested =
          input.attachment === undefined
            ? undefined
            : this.normalizeNullable(input.attachment);
        // undefined keeps the attachment: the form sends the current value back on every edit.
        if (
          requested === undefined ||
          requested === this.locationOf(previous)
        ) {
          return {
            saved: await manager.save(row),
            attachment: previous,
            replaced: null
          };
        }

        const attachment = await this.resolveAttachment(
          manager,
          userId,
          requested
        );
        row.attachmentId = attachment?.id ?? null;
        const saved = await manager.save(row);
        if (previous) {
          await manager.delete(CvAttachmentEntity, { id: previous.id });
        }
        return { saved, attachment, replaced: previous };
      }
    );
    if (!result) {
      return null;
    }

    await this.removeStoredFile(result.replaced);
    return this.mapEntityToCvVersion(result.saved, result.attachment);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const removed = await this.repository.manager.transaction(
      async (manager) => {
        const row = await this.findOwnRowForWrite(manager, userId, id);
        if (!row) {
          return null;
        }

        const attachment = await this.findAttachment(manager, row.attachmentId);
        await manager.delete(CvVersionEntity, { id, userId });
        if (attachment) {
          await manager.delete(CvAttachmentEntity, { id: attachment.id });
        }
        return { attachment };
      }
    );
    if (!removed) {
      return false;
    }

    await this.removeStoredFile(removed.attachment);
    return true;
  }
}

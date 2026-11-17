import { Injectable } from '@nestjs/common';
import type { Stats } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

/** Where a stored CV file is served; the API reports this path as `attachment`. */
export const CV_ATTACHMENT_PREFIX = '/uploads/cv-attachments/';

// Uploads have always been named `<uuid>.pdf`; nothing else is ever read from disk.
const FILE_NAME_PATTERN =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.pdf$/;

/** The upload id a file name stands for, or null. */
export function cvAttachmentIdFromFileName(fileName: string): string | null {
  return FILE_NAME_PATTERN.exec(fileName)?.[1] ?? null;
}

/** The upload id an `attachment` path stands for, or null for anything else. */
export function cvAttachmentIdFromPath(attachment: string): string | null {
  return attachment.startsWith(CV_ATTACHMENT_PREFIX)
    ? cvAttachmentIdFromFileName(attachment.slice(CV_ATTACHMENT_PREFIX.length))
    : null;
}

export function cvAttachmentPath(id: string): string {
  return `${CV_ATTACHMENT_PREFIX}${id}.pdf`;
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === 'ENOENT';
}

/** The PDFs on disk, addressed by upload id. */
@Injectable()
export class CvAttachmentFiles {
  private readonly dir = path.resolve(
    process.cwd(),
    'uploads',
    'cv-attachments'
  );

  async write(id: string, buffer: Buffer): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(this.absolutePath(id), buffer);
  }

  absolutePath(id: string): string {
    return path.join(this.dir, `${id}.pdf`);
  }

  async remove(id: string): Promise<void> {
    try {
      await fs.unlink(this.absolutePath(id));
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
  }

  /** Ids of stored files last written before `cutoff`. */
  async listWrittenBefore(cutoff: Date): Promise<string[]> {
    let entries: string[];
    try {
      entries = await fs.readdir(this.dir);
    } catch (error) {
      if (isMissing(error)) return [];
      throw error;
    }

    const stale: string[] = [];
    for (const fileName of entries) {
      const id = cvAttachmentIdFromFileName(fileName);
      if (!id) continue;

      const stat = await this.statFile(id);
      if (stat && stat.mtime < cutoff) {
        stale.push(id);
      }
    }

    return stale;
  }

  // Null for a file deleted since the directory was listed.
  private async statFile(id: string): Promise<Stats | null> {
    try {
      const stat = await fs.stat(this.absolutePath(id));
      return stat.isFile() ? stat : null;
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
  }
}

import { Injectable } from '@nestjs/common';
import fs from 'node:fs/promises';
import path from 'node:path';

const FILE_NAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === 'ENOENT';
}

/** Application attachments on disk, addressed by attachment id. */
@Injectable()
export class JobAttachmentFiles {
  private readonly dir = path.resolve(
    process.cwd(),
    'uploads',
    'job-attachments'
  );

  async write(id: string, buffer: Buffer): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(this.absolutePath(id), buffer);
  }

  absolutePath(id: string): string {
    return path.join(this.dir, id);
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
    for (const id of entries) {
      if (!FILE_NAME_PATTERN.test(id)) continue;
      try {
        const stat = await fs.stat(this.absolutePath(id));
        if (stat.isFile() && stat.mtime < cutoff) stale.push(id);
      } catch (error) {
        if (!isMissing(error)) throw error;
      }
    }
    return stale;
  }
}

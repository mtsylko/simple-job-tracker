/** A file kept with an application, such as an interview transcript. */
export type JobAttachment = {
  id: string;
  fileName: string;
  size: number;
  createdAt: string;
};

export const JOB_ATTACHMENT_MAX_SIZE_MB = 10;

export const JOB_ATTACHMENT_MAX_PER_JOB = 20;

/** Accepted extensions and the content type each one is served with. */
export const JOB_ATTACHMENT_TYPES: Readonly<Record<string, string>> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.rtf': 'application/rtf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

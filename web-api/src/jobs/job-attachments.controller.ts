import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { z } from 'zod';
import {
  JOB_ATTACHMENT_MAX_SIZE_MB,
  type JobAttachment
} from '@job-tracker/shared';
import { JobAttachmentsService } from './job-attachments.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { apiError } from '../common/errors/api-error';

const jobIdSchema = z.string().uuid({ message: 'Invalid job id' });
const attachmentIdSchema = z
  .string()
  .uuid({ message: 'Invalid attachment id' });

function attachmentNotFound(): NotFoundException {
  return new NotFoundException(
    apiError('JOB_ATTACHMENT_NOT_FOUND', 'Attachment not found')
  );
}

/** Files kept with an application, such as interview transcripts. */
@Controller('api/jobs/:jobId/attachments')
@UseGuards(JwtAuthGuard)
export class JobAttachmentsController {
  constructor(private readonly attachments: JobAttachmentsService) {}

  @Get()
  list(
    @CurrentUser() user: UserEntity,
    @Param('jobId', new ZodValidationPipe(jobIdSchema)) jobId: string
  ): Promise<JobAttachment[]> {
    return this.attachments.list(user.id, jobId);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: JOB_ATTACHMENT_MAX_SIZE_MB * 1024 * 1024 },
      // Browsers send non-ASCII file names as raw UTF-8.
      defParamCharset: 'utf8'
    })
  )
  async add(
    @CurrentUser() user: UserEntity,
    @Param('jobId', new ZodValidationPipe(jobIdSchema)) jobId: string,
    @UploadedFile()
    file: { originalname?: unknown; buffer?: unknown } | undefined
  ): Promise<JobAttachment> {
    if (!file || !Buffer.isBuffer(file.buffer)) {
      throw new BadRequestException(
        apiError('JOB_ATTACHMENT_REQUIRED', 'Attachment file is required')
      );
    }

    return this.attachments.add(user.id, jobId, {
      originalName:
        typeof file.originalname === 'string' ? file.originalname : '',
      buffer: file.buffer
    });
  }

  @Get(':attachmentId')
  async download(
    @CurrentUser() user: UserEntity,
    @Param('jobId', new ZodValidationPipe(jobIdSchema)) jobId: string,
    @Param('attachmentId', new ZodValidationPipe(attachmentIdSchema))
    attachmentId: string,
    @Res() res: Response
  ): Promise<void> {
    const stored = await this.attachments.findFile(
      user.id,
      jobId,
      attachmentId
    );
    if (!stored) throw attachmentNotFound();

    // Always a download, never rendered: the content is whatever the user uploaded.
    res.attachment(stored.fileName);
    res.setHeader('Content-Type', stored.contentType);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', 'sandbox');

    await new Promise<void>((resolve, reject) => {
      res.sendFile(
        stored.absolutePath,
        { cacheControl: false },
        (error?: Error & { status?: number }) => {
          if (!error || res.headersSent) resolve();
          else if (error.status === 404) reject(attachmentNotFound());
          else reject(error);
        }
      );
    });
  }

  @Delete(':attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserEntity,
    @Param('jobId', new ZodValidationPipe(jobIdSchema)) jobId: string,
    @Param('attachmentId', new ZodValidationPipe(attachmentIdSchema))
    attachmentId: string
  ): Promise<void> {
    const removed = await this.attachments.remove(user.id, jobId, attachmentId);
    if (!removed) throw attachmentNotFound();
  }
}

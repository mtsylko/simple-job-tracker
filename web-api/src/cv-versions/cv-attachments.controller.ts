import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Res,
  UseGuards
} from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { CvVersionsService } from './cv-versions.service';
import { cvAttachmentIdFromFileName } from './cv-attachment-files';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { apiError } from '../common/errors/api-error';

// The served name `<id>.pdf`, read as the upload id.
const fileNameSchema = z.string().transform((fileName, context) => {
  const id = cvAttachmentIdFromFileName(fileName);
  if (!id) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid attachment name'
    });
    return z.NEVER;
  }
  return id;
});

/** Serves an uploaded CV to the user who uploaded it, and to nobody else. */
@Controller('uploads/cv-attachments')
@UseGuards(JwtAuthGuard)
export class CvAttachmentsController {
  constructor(private readonly cvVersionsService: CvVersionsService) {}

  @Get(':fileName')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async read(
    @CurrentUser() user: UserEntity,
    @Param('fileName', new ZodValidationPipe(fileNameSchema)) id: string,
    @Res() res: Response
  ): Promise<void> {
    const absolutePath = await this.cvVersionsService.findOwnedAttachment(
      user.id,
      id
    );
    if (!absolutePath) {
      throw new NotFoundException(
        apiError('CV_ATTACHMENT_NOT_FOUND', 'Attachment not found')
      );
    }

    // sendFile answers Range requests, as the old static mount did, so a viewer can fetch pages as needed.
    await new Promise<void>((resolve, reject) => {
      res.sendFile(
        absolutePath,
        {
          cacheControl: false,
          headers: { 'Content-Disposition': `inline; filename="${id}.pdf"` }
        },
        (error?: Error & { status?: number }) => {
          if (!error || res.headersSent) {
            resolve();
          } else if (error.status === 404) {
            reject(
              new NotFoundException(
                apiError('CV_ATTACHMENT_NOT_FOUND', 'Attachment not found')
              )
            );
          } else {
            reject(error);
          }
        }
      );
    });
  }
}

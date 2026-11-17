import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import path from 'node:path';
import { z } from 'zod';
import type {
  CreateCvVersionInput,
  UpdateCvVersionInput
} from '@job-tracker/shared';
import { CvVersion, CvVersionsService } from './cv-versions.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { apiError } from '../common/errors/api-error';

const nullableTrimmedStringSchema = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional();

const createCvVersionSchema = z
  .object({
    name: z.string().trim().min(1),
    description: nullableTrimmedStringSchema,
    attachment: nullableTrimmedStringSchema,
    sourceLink: z.string().trim().url().nullable().optional(),
    enabled: z.boolean().nullable().optional()
  })
  .strict();

const updateCvVersionSchema = createCvVersionSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required for update'
  });

const idSchema = z.string().uuid({ message: 'Invalid cv version id' });

@Controller('api/cv-versions')
@UseGuards(JwtAuthGuard)
export class CvVersionsController {
  constructor(private readonly cvVersionsService: CvVersionsService) {}

  @Post('upload-attachment')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } })
  )
  async uploadAttachment(
    @CurrentUser() user: UserEntity,
    @UploadedFile()
    file:
      | {
          originalname?: unknown;
          mimetype?: unknown;
          buffer?: unknown;
        }
      | undefined
  ): Promise<{ attachment: string }> {
    if (!file || !Buffer.isBuffer(file.buffer)) {
      throw new BadRequestException(
        apiError('CV_ATTACHMENT_REQUIRED', 'Attachment file is required.')
      );
    }

    const originalName =
      typeof file.originalname === 'string' ? file.originalname : '';
    const mimeType = typeof file.mimetype === 'string' ? file.mimetype : '';
    const ext = path.extname(originalName).toLowerCase();
    const isPdf = mimeType === 'application/pdf' || ext === '.pdf';

    if (!isPdf) {
      throw new BadRequestException(
        apiError('CV_ATTACHMENT_NOT_PDF', 'Only PDF files are supported.')
      );
    }

    const attachment = await this.cvVersionsService.saveAttachment(
      user.id,
      file.buffer
    );
    return { attachment };
  }

  @Post()
  async create(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createCvVersionSchema))
    payload: CreateCvVersionInput
  ): Promise<CvVersion> {
    return this.cvVersionsService.create(user.id, payload);
  }

  @Get()
  async findAll(@CurrentUser() user: UserEntity): Promise<CvVersion[]> {
    return this.cvVersionsService.findAll(user.id);
  }

  @Get(':id')
  async findById(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<CvVersion> {
    const cvVersion = await this.cvVersionsService.findById(user.id, id);
    if (!cvVersion) {
      throw new NotFoundException(
        apiError('CV_VERSION_NOT_FOUND', 'CV version not found')
      );
    }

    return cvVersion;
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateCvVersionSchema))
    payload: UpdateCvVersionInput
  ): Promise<CvVersion> {
    const cvVersion = await this.cvVersionsService.update(user.id, id, payload);
    if (!cvVersion) {
      throw new NotFoundException(
        apiError('CV_VERSION_NOT_FOUND', 'CV version not found')
      );
    }

    return cvVersion;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<void> {
    const deleted = await this.cvVersionsService.remove(user.id, id);
    if (!deleted) {
      throw new NotFoundException(
        apiError('CV_VERSION_NOT_FOUND', 'CV version not found')
      );
    }
  }
}

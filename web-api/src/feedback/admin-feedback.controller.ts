import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UseGuards
} from '@nestjs/common';
import { z } from 'zod';
import type { AdminFeedback, UpdateFeedbackInput } from '@job-tracker/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FeedbackService } from './feedback.service';
import { apiError } from '../common/errors/api-error';

const idSchema = z.string().uuid({ message: 'Invalid feedback id' });

const updateFeedbackSchema = z.object({ resolved: z.boolean() }).strict();

@Controller('api/admin/feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminFeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Get()
  list(): Promise<AdminFeedback[]> {
    return this.service.listForAdmin();
  }

  @Patch(':id')
  async update(
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateFeedbackSchema))
    payload: UpdateFeedbackInput
  ): Promise<AdminFeedback> {
    const updated = await this.service.setResolved(id, payload.resolved);
    if (!updated) {
      throw new NotFoundException(
        apiError('FEEDBACK_NOT_FOUND', 'Feedback not found')
      );
    }
    return updated;
  }
}

import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  UseGuards
} from '@nestjs/common';
import { z } from 'zod';
import {
  FEEDBACK_KINDS,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  type CreateFeedbackInput
} from '@job-tracker/shared';
import type { UserEntity } from '../auth/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FeedbackService } from './feedback.service';
import { apiError } from '../common/errors/api-error';

const createFeedbackSchema = z
  .object({
    kind: z.enum(FEEDBACK_KINDS),
    message: z.string().trim().min(1).max(FEEDBACK_MESSAGE_MAX_LENGTH),
    pagePath: z.string().startsWith('/').max(2048).nullable()
  })
  .strict();

@Controller('api/feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async create(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createFeedbackSchema))
    payload: CreateFeedbackInput,
    @Headers('user-agent') userAgent: string | undefined
  ): Promise<void> {
    const result = await this.service.create(user.id, payload, userAgent);
    if (result === 'limit-reached') {
      throw new HttpException(
        apiError(
          'FEEDBACK_DAILY_LIMIT_REACHED',
          'You have sent several messages today — please try again tomorrow'
        ),
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }
}

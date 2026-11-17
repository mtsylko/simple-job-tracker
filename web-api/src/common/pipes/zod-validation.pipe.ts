import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform
} from '@nestjs/common';
import type { ApiErrorCode } from '@job-tracker/shared';
import { z } from 'zod';

function readValidationError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return 'Validation error';
  }

  if (issue.path.length === 0) {
    return issue.message;
  }

  return `${issue.path.join('.')}: ${issue.message}`;
}

@Injectable()
export class ZodValidationPipe<
  TSchema extends z.ZodTypeAny
> implements PipeTransform<unknown, z.infer<TSchema>> {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): z.infer<TSchema> {
    const validation = this.schema.safeParse(value);
    if (!validation.success) {
      // Zod's own wording stays English; the web app quotes it after its own copy for the code.
      throw new BadRequestException({
        error: readValidationError(validation.error),
        code: 'VALIDATION_FAILED' satisfies ApiErrorCode
      });
    }

    return validation.data;
  }
}

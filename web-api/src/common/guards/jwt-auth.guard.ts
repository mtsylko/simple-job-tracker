import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { DataSource } from 'typeorm';
import { z } from 'zod';
import { ADMIN_VIEW_SESSION_HOURS, VIEW_AS_HEADER } from '@job-tracker/shared';
import { UserEntity } from '../../auth/user.entity';
import { apiError } from '../errors/api-error';

const READ_METHODS = new Set(['GET', 'HEAD']);

const viewedIdSchema = z.string().uuid();

/** Authenticates the session; an admin naming a user's account in `VIEW_AS_HEADER` is answered as that user, read-only. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // DataSource is global, so the many modules using this guard need no entity import.
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!(await super.canActivate(context))) {
      return false;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: UserEntity }>();
    const viewedId = request.header(VIEW_AS_HEADER);

    if (viewedId !== undefined) {
      request.user = await this.viewedUser(
        request.user,
        viewedId,
        request.method
      );
    }

    return true;
  }

  private async viewedUser(
    admin: UserEntity,
    viewedId: string,
    method: string
  ): Promise<UserEntity> {
    if (admin.role !== 'admin') {
      throw new ForbiddenException(
        apiError('VIEW_AS_ADMIN_ONLY', 'Only an admin can view another account')
      );
    }
    if (!READ_METHODS.has(method)) {
      throw new ForbiddenException(
        apiError('VIEW_AS_READ_ONLY', 'Viewing another account is read-only')
      );
    }
    if (!viewedIdSchema.safeParse(viewedId).success) {
      throw new BadRequestException(
        apiError('VALIDATION_FAILED', 'Invalid user id')
      );
    }

    const viewed = await this.dataSource
      .getRepository(UserEntity)
      .createQueryBuilder('viewed')
      .where('viewed.id = :viewedId', { viewedId })
      .andWhere('viewed.role = :role', { role: 'user' })
      .andWhere(
        `EXISTS (
          SELECT 1 FROM admin_view_sessions session
          WHERE session.admin_id = :adminId
            AND session.user_id = viewed.id
            AND session.started_at > now() - make_interval(hours => :hours)
            AND session.ended_at IS NULL
        )`,
        { adminId: admin.id, hours: ADMIN_VIEW_SESSION_HOURS }
      )
      .getOne();

    // One answer for every refusal, so the header cannot probe which accounts exist.
    if (!viewed) {
      throw new ForbiddenException(
        apiError(
          'VIEW_AS_NOT_OPEN',
          'This account is not open to you — open it again from the users list'
        )
      );
    }

    return viewed;
  }
}

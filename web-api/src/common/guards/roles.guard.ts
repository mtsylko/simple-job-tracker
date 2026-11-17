import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@job-tracker/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { UserEntity } from '../../auth/user.entity';
import { apiError } from '../errors/api-error';

/**
 * Must run after JwtAuthGuard, which populates `request.user`.
 * Routes without @Roles() are unrestricted.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: UserEntity }>();
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException(
        apiError('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions')
      );
    }
    return true;
  }
}

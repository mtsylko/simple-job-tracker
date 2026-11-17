import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';
import { z } from 'zod';
import type { AdminUserSummary, AdminViewTarget } from '@job-tracker/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { UserEntity } from '../auth/user.entity';
import { AdminService } from './admin.service';
import { apiError } from '../common/errors/api-error';

const idSchema = z.string().uuid({ message: 'Invalid user id' });

// The one place that reads across users, so admin-only; every opening of a user's records is logged.
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(): Promise<AdminUserSummary[]> {
    return this.adminService.listUsers();
  }

  @Post('users/:id/view-sessions')
  async startViewSession(
    @CurrentUser() admin: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<AdminViewTarget> {
    const result = await this.adminService.startViewSession(admin.id, id);

    if (result.kind === 'not-found') {
      throw new NotFoundException(apiError('USER_NOT_FOUND', 'User not found'));
    }
    if (result.kind === 'not-allowed') {
      throw new ForbiddenException(
        apiError(
          'ADMIN_ACCOUNT_NOT_VIEWABLE',
          'An admin account cannot be opened'
        )
      );
    }

    return result.target;
  }

  @Delete('users/:id/view-sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  endViewSessions(
    @CurrentUser() admin: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<void> {
    return this.adminService.endViewSessions(admin.id, id);
  }
}

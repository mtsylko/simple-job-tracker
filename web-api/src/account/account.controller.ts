import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards
} from '@nestjs/common';
import type { Response } from 'express';
import type { UserEntity } from '../auth/user.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AccountService, type AccountExport } from './account.service';

@Controller('api/account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly service: AccountService) {}

  @Get('export')
  async export(
    @CurrentUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response
  ): Promise<AccountExport> {
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="job-tracker-export-${date}.json"`
    );
    return this.service.export(user.id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: UserEntity,
    @Res({ passthrough: true }) res: Response
  ): Promise<void> {
    await this.service.delete(user.id);
    res.clearCookie('access_token');
  }
}

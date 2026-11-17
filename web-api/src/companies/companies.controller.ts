import {
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
  UseGuards
} from '@nestjs/common';
import { z } from 'zod';
import type {
  BlacklistCompanyInput,
  Company,
  CompanySummary,
  UpdateCompanyBlacklistInput
} from '@job-tracker/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../auth/user.entity';
import { apiError } from '../common/errors/api-error';

const reasonSchema = z.string().trim().max(500).nullish();

const blacklistCompanySchema = z
  .object({
    company: z.string().trim().min(1),
    reason: reasonSchema
  })
  .strict();

const updateBlacklistSchema = z
  .object({
    reason: reasonSchema
  })
  .strict();

const idSchema = z.string().uuid({ message: 'Invalid company id' });

@Controller('api/companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  async findAll(@CurrentUser() user: UserEntity): Promise<CompanySummary[]> {
    return this.service.list(user.id);
  }

  @Post('blacklist')
  async blacklist(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(blacklistCompanySchema))
    payload: BlacklistCompanyInput
  ): Promise<Company> {
    return this.service.blacklist(user.id, payload.company, payload.reason);
  }

  @Patch(':id/blacklist')
  async updateBlacklist(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateBlacklistSchema))
    payload: UpdateCompanyBlacklistInput
  ): Promise<Company> {
    const updated = await this.service.updateBlacklistReason(
      user.id,
      id,
      payload.reason
    );
    if (!updated) {
      throw new NotFoundException(
        apiError('COMPANY_NOT_FOUND', 'Blacklisted company not found')
      );
    }
    return updated;
  }

  @Delete(':id/blacklist')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblacklist(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<void> {
    const removed = await this.service.unblacklist(user.id, id);
    if (!removed) {
      throw new NotFoundException(
        apiError('COMPANY_NOT_FOUND', 'Blacklisted company not found')
      );
    }
  }
}

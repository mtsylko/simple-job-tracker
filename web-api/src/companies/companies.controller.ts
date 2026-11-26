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
  Query,
  UseGuards
} from '@nestjs/common';
import { z } from 'zod';
import type {
  BlacklistCompanyInput,
  Company,
  CompanyDetails,
  CompanySummary,
  CreateCompanyInput,
  UpdateCompanyBlacklistInput,
  UpdateCompanyInput
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

const companyNameSchema = z.string().trim().min(1).max(200);

// Only web links: the page renders the website as one.
const websiteSchema = z
  .string()
  .trim()
  .max(500)
  .url()
  .refine((value) => /^https?:\/\//i.test(value), {
    message: 'Website must start with http:// or https://'
  });

const createCompanySchema = z
  .object({
    name: companyNameSchema,
    website: websiteSchema.nullish(),
    notes: z.string().trim().max(5000).nullish(),
    blacklisted: z.boolean().optional(),
    blacklistReason: reasonSchema
  })
  .strict();

const updateCompanySchema = z
  .object({
    company: companyNameSchema,
    name: companyNameSchema.optional(),
    website: websiteSchema.nullish(),
    notes: z.string().trim().max(5000).nullish(),
    isProductCompany: z.boolean().optional(),
    blacklisted: z.boolean().optional(),
    blacklistReason: reasonSchema
  })
  .strict();

const companyNotFound = () =>
  new NotFoundException(apiError('COMPANY_NOT_FOUND', 'Company not found'));

@Controller('api/companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get()
  async findAll(@CurrentUser() user: UserEntity): Promise<CompanySummary[]> {
    return this.service.list(user.id);
  }

  @Post()
  async create(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(createCompanySchema))
    payload: CreateCompanyInput
  ): Promise<CompanyDetails> {
    return this.service.create(user.id, payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: UserEntity,
    @Param('id', new ZodValidationPipe(idSchema)) id: string
  ): Promise<void> {
    if (!(await this.service.remove(user.id, id))) {
      throw companyNotFound();
    }
  }

  @Get('details')
  async details(
    @CurrentUser() user: UserEntity,
    @Query('name', new ZodValidationPipe(companyNameSchema)) name: string
  ): Promise<CompanyDetails> {
    const details = await this.service.details(user.id, name);
    if (!details) {
      throw companyNotFound();
    }
    return details;
  }

  @Patch('details')
  async update(
    @CurrentUser() user: UserEntity,
    @Body(new ZodValidationPipe(updateCompanySchema))
    payload: UpdateCompanyInput
  ): Promise<CompanyDetails> {
    const details = await this.service.update(user.id, payload);
    if (!details) {
      throw companyNotFound();
    }
    return details;
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

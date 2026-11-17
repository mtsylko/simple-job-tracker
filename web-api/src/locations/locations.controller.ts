import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { LocationsService } from './locations.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

const querySchema = z.string().trim().min(1).max(120);

@Controller('api/locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('suggest')
  async suggest(
    @Query('q', new ZodValidationPipe(querySchema)) query: string
  ): Promise<string[]> {
    return this.locationsService.suggest(query);
  }
}

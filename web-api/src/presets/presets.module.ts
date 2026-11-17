import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobRolesModule } from '../job-roles/job-roles.module';
import { JobLevelsModule } from '../job-levels/job-levels.module';
import { JobTypesModule } from '../job-types/job-types.module';
import { JobFieldsModule } from '../job-fields/job-fields.module';
import { UserEntity } from '../auth/user.entity';
import { PresetsController } from './presets.controller';
import { PresetsService } from './presets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JobRolesModule,
    JobLevelsModule,
    JobTypesModule,
    JobFieldsModule
  ],
  controllers: [PresetsController],
  providers: [PresetsService]
})
export class PresetsModule {}

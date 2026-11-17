import { Module } from '@nestjs/common';
import { CvVersionsModule } from '../cv-versions/cv-versions.module';
import { JobsModule } from '../jobs/jobs.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [CvVersionsModule, JobsModule],
  controllers: [AccountController],
  providers: [AccountService]
})
export class AccountModule {}

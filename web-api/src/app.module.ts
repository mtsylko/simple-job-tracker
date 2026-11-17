import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { loggerOptions } from './common/logging/logger.options';
import { AccountModule } from './account/account.module';
import { PresetsModule } from './presets/presets.module';
import { AuthModule } from './auth/auth.module';
import { CvVersionsModule } from './cv-versions/cv-versions.module';
import { FormLayoutModule } from './form-layout/form-layout.module';
import { JobFieldsModule } from './job-fields/job-fields.module';
import { JobLevelsModule } from './job-levels/job-levels.module';
import { JobRolesModule } from './job-roles/job-roles.module';
import { JobTypesModule } from './job-types/job-types.module';
import { JobEmploymentTypesModule } from './job-employment-types/job-employment-types.module';
import { JobContractTypesModule } from './job-contract-types/job-contract-types.module';
import { JobStatusesModule } from './job-statuses/job-statuses.module';
import { JobOutcomesModule } from './job-outcomes/job-outcomes.module';
import { CompaniesModule } from './companies/companies.module';
import { JobsModule } from './jobs/jobs.module';
import { LocationsModule } from './locations/locations.module';
import { AdminModule } from './admin/admin.module';
import { FeedbackModule } from './feedback/feedback.module';
import { TranslationsModule } from './translations/translations.module';

@Module({
  imports: [
    LoggerModule.forRoot(loggerOptions),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        'postgres://postgres:postgres@localhost:5432/job_tracker',
      autoLoadEntities: true,
      // Schema is owned by migrations now, so synchronize stays off everywhere.
      // Pending migrations are applied on boot. `__dirname` is `src` under ts-node
      // and `dist` once compiled, so the {ts,js} glob covers both.
      synchronize: false,
      migrationsRun: true,
      migrations: [`${__dirname}/migrations/*.{ts,js}`]
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    JobsModule,
    CvVersionsModule,
    FormLayoutModule,
    JobFieldsModule,
    JobRolesModule,
    JobLevelsModule,
    JobTypesModule,
    JobEmploymentTypesModule,
    JobContractTypesModule,
    JobStatusesModule,
    JobOutcomesModule,
    CompaniesModule,
    PresetsModule,
    LocationsModule,
    AdminModule,
    FeedbackModule,
    TranslationsModule,
    AccountModule
  ],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }]
})
export class AppModule {}

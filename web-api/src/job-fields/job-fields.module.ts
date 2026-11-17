import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '../jobs/job.entity';
import { JobFieldDefinitionEntity } from './job-field-definition.entity';
import { JobFieldsController } from './job-fields.controller';
import { JobFieldsService } from './job-fields.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobFieldDefinitionEntity, JobEntity])],
  controllers: [JobFieldsController],
  providers: [JobFieldsService],
  exports: [JobFieldsService]
})
export class JobFieldsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '../jobs/job.entity';
import { JobContractTypesController } from './job-contract-types.controller';
import { JobContractTypeOptionEntity } from './job-contract-type-option.entity';
import { JobContractTypesService } from './job-contract-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobContractTypeOptionEntity, JobEntity])],
  controllers: [JobContractTypesController],
  providers: [JobContractTypesService],
  exports: [JobContractTypesService]
})
export class JobContractTypesModule {}

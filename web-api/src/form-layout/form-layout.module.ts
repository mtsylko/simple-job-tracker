import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormLayoutEntity } from './form-layout.entity';
import { FormLayoutController } from './form-layout.controller';
import { FormLayoutService } from './form-layout.service';

@Module({
  imports: [TypeOrmModule.forFeature([FormLayoutEntity])],
  controllers: [FormLayoutController],
  providers: [FormLayoutService],
  exports: [FormLayoutService]
})
export class FormLayoutModule {}

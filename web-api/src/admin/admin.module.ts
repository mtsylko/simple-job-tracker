import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminViewSessionEntity } from './admin-view-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AdminViewSessionEntity])],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}

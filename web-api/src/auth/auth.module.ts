import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { jwtSecret } from './jwt-secret';
import { JwtStrategy } from './jwt.strategy';
import { UserEntity } from './user.entity';
import { JobStatusesModule } from '../job-statuses/job-statuses.module';
import { JobOutcomesModule } from '../job-outcomes/job-outcomes.module';
import { JobEmploymentTypesModule } from '../job-employment-types/job-employment-types.module';
import { JobContractTypesModule } from '../job-contract-types/job-contract-types.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JobStatusesModule,
    JobOutcomesModule,
    JobEmploymentTypesModule,
    JobContractTypesModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtSecret(),
        signOptions: { expiresIn: '7d' }
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule]
})
export class AuthModule {}

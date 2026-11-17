import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { UserEntity } from './user.entity';
import type { JwtPayload } from './jwt.strategy';
import { DEFAULT_USER_ROLE, type UserRole } from '@job-tracker/shared';
import { JobStatusesService } from '../job-statuses/job-statuses.service';
import { JobOutcomesService } from '../job-outcomes/job-outcomes.service';
import { JobEmploymentTypesService } from '../job-employment-types/job-employment-types.service';
import { JobContractTypesService } from '../job-contract-types/job-contract-types.service';

interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

// Read per call rather than once at import: `main.ts` loads `.env` after the
// module graph, so a set built out here would never see the file.
function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

function resolveRole(email: string): UserRole {
  return adminEmails().has(email.toLowerCase()) ? 'admin' : DEFAULT_USER_ROLE;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    private jwtService: JwtService,
    private jobStatusesService: JobStatusesService,
    private jobOutcomesService: JobOutcomesService,
    private jobEmploymentTypesService: JobEmploymentTypesService,
    private jobContractTypesService: JobContractTypesService
  ) {}

  async findOrCreateGoogleUser(profile: GoogleProfile): Promise<UserEntity> {
    let user = await this.userRepo.findOneBy({ googleId: profile.googleId });
    if (!user) {
      user = await this.userRepo.findOneBy({ email: profile.email });
    }
    if (user) {
      user.googleId = profile.googleId;
      user.displayName = profile.displayName;
      user.avatarUrl = profile.avatarUrl;
      user.role = resolveRole(profile.email);
      return this.userRepo.save(user);
    }
    const created = await this.userRepo.save(
      this.userRepo.create({
        id: randomUUID(),
        email: profile.email,
        googleId: profile.googleId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        role: resolveRole(profile.email)
      })
    );
    // Statuses and outcomes are picked lists, not typed like role/level/type, so
    // a new user needs the built-ins before their first application form loads.
    await this.jobStatusesService.seedDefaults(created.id);
    await this.jobOutcomesService.seedDefaults(created.id);
    await this.jobEmploymentTypesService.seedDefaults(created.id);
    await this.jobContractTypesService.seedDefaults(created.id);
    return created;
  }

  signJwt(user: UserEntity): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}

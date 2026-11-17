import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UserEntity } from './user.entity';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(): void {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response): void {
    const user = req.user as UserEntity;
    const token = this.authService.signJwt(user);
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE_MS
    });
    res.redirect(`${FRONTEND_URL}/`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: Request): UserEntity {
    return req.user as UserEntity;
  }

  @Get('logout')
  logout(@Res() res: Response): void {
    res.clearCookie('access_token');
    res.redirect(`${FRONTEND_URL}/sign-in`);
  }
}

import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { loginSchema } from '@ecosphere/shared';
import { AuthService } from './auth.service';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { jsonApiDocument, jsonApiResource } from '../../common/json-api/json-api.util';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from '../../common/security/cookie.config';
import type { AuthenticatedUser } from '../../common/types/request.types';

function serializeUser(user: AuthenticatedUser) {
  return jsonApiResource('users', user.id, {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles,
    permissions: user.permissions,
  });
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const input = loginSchema.parse(body);
    const result = await this.authService.login(input.email, input.password);
    setAuthCookies(response, result.accessToken, result.refreshToken);
    return jsonApiDocument(serializeUser(result.user), { tokenType: 'Bearer' });
  }

  @Post('register')
  async register(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.register(body);
    setAuthCookies(response, result.accessToken, result.refreshToken);
    return jsonApiDocument(serializeUser(result.user), { tokenType: 'Bearer' });
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: unknown) {
    return this.authService.requestPasswordReset(body);
  }

  @Post('reset-password')
  resetPassword(@Body() body: unknown) {
    return this.authService.resetPassword(body);
  }

  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!refreshToken) {
      clearAuthCookies(response);
      return jsonApiDocument(null, { authenticated: false });
    }

    const tokens = await this.authService.refresh(refreshToken);
    setAuthCookies(response, tokens.accessToken, tokens.refreshToken);
    return jsonApiDocument(null, { authenticated: true, tokenType: 'Bearer' });
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (refreshToken) {
      try {
        await this.authService.logout(refreshToken);
      } catch {
        // Always clear cookies even if the refresh token was already revoked.
      }
    }
    clearAuthCookies(response);
    return jsonApiDocument(null, { success: true });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return jsonApiDocument(serializeUser(user));
  }
}


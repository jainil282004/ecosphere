import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  registerAccountSchema,
  resetPasswordSchema,
  resolvePermissions,
  updateProfileSchema,
  type Role,
} from '@ecosphere/shared';
import { AuthRepository } from '../../database/repositories/auth.repository';
import type { AuthenticatedUser } from '../../common/types/request.types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<AuthenticatedUser | null> {
    const user = await this.authRepository.findActiveUserByEmail(email);

    if (!user) {
      return null;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return null;
    }

    return this.buildAuthenticatedUser(user.id, user.email, user.firstName, user.lastName);
  }

  async buildAuthenticatedUser(
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<AuthenticatedUser> {
    const roleRows = await this.authRepository.findActiveRolesByUserId(userId);

    const roles = roleRows.map((row) => ({
      id: row.id,
      role: row.role as Role,
      organizationId: row.organizationId,
      departmentId: row.departmentId,
    }));

    const permissions = resolvePermissions(roles.map((row) => row.role));

    return {
      id: userId,
      email,
      firstName,
      lastName,
      roles,
      permissions,
    };
  }

  async login(email: string, password: string): Promise<{ user: AuthenticatedUser } & TokenPair> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const tokens = await this.issueTokenPair(user);
    return { user, ...tokens };
  }

  async register(body: unknown): Promise<{ user: AuthenticatedUser } & TokenPair> {
    const input = registerAccountSchema.parse(body);
    const existing = await this.authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const org = await this.authRepository.findOrganizationBySlug(input.organizationSlug);
    if (!org) {
      throw new BadRequestException('Organization not found. Contact your administrator.');
    }

    const defaultDepartment = await this.authRepository.findFirstDepartment(org.id);
    if (!defaultDepartment) {
      throw new BadRequestException('Organization has no departments configured.');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const [createdUser] = await this.authRepository.createUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    if (!createdUser) {
      throw new BadRequestException('Failed to create account.');
    }

    await this.authRepository.assignUserRole({
      userId: createdUser.id,
      role: 'employee',
      organizationId: org.id,
      departmentId: defaultDepartment.id,
    });

    const user = await this.buildAuthenticatedUser(
      createdUser.id,
      createdUser.email,
      createdUser.firstName,
      createdUser.lastName,
    );
    const tokens = await this.issueTokenPair(user);
    return { user, ...tokens };
  }

  async changePassword(userId: string, body: unknown): Promise<{ success: true }> {
    const input = changePasswordSchema.parse(body);
    const user = await this.authRepository.findUserById(userId);

    if (!user || !user.isActive) {
      throw new NotFoundException('User account not found or is inactive.');
    }

    const passwordValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Incorrect current password.');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await this.authRepository.updateUserPassword(user.id, passwordHash);

    return { success: true };
  }

  async updateProfile(userId: string, body: unknown): Promise<{ user: AuthenticatedUser }> {
    const input = updateProfileSchema.parse(body);
    const user = await this.authRepository.findUserById(userId);

    if (!user || !user.isActive) {
      throw new NotFoundException('User account not found or is inactive.');
    }

    await this.authRepository.updateUserProfile(user.id, {
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const updatedUser = await this.buildAuthenticatedUser(
      user.id,
      user.email,
      input.firstName,
      input.lastName,
    );

    return { user: updatedUser };
  }

  async requestPasswordReset(body: unknown): Promise<{ message: string; resetToken?: string }> {
    const input = forgotPasswordSchema.parse(body);
    const user = await this.authRepository.findActiveUserByEmail(input.email);

    if (!user) {
      return {
        message: 'If an account exists for that email, password reset instructions have been sent.',
      };
    }

    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.authRepository.insertPasswordResetToken({
      userId: user.id,
      tokenHash: this.hashToken(resetToken),
      expiresAt,
    });

    const isDev = this.configService.get<string>('NODE_ENV', 'development') !== 'production';

    return {
      message: 'If an account exists for that email, password reset instructions have been sent.',
      ...(isDev ? { resetToken } : {}),
    };
  }

  async resetPassword(body: unknown): Promise<{ success: true }> {
    const input = resetPasswordSchema.parse(body);
    const stored = await this.authRepository.findValidPasswordResetToken(
      this.hashToken(input.token),
    );

    if (!stored) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    const user = await this.authRepository.findUserById(stored.userId);
    if (!user || !user.isActive) {
      throw new NotFoundException('User account not found.');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    await this.authRepository.updateUserPassword(user.id, passwordHash);
    await this.authRepository.markPasswordResetTokenUsed(stored.id);

    return { success: true };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.authRepository.findValidRefreshToken(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.authRepository.findUserById(storedToken.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive.');
    }

    await this.authRepository.revokeRefreshToken(storedToken.id);

    const authenticatedUser = await this.buildAuthenticatedUser(
      user.id,
      user.email,
      user.firstName,
      user.lastName,
    );

    return this.issueTokenPair(authenticatedUser);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.authRepository.revokeRefreshTokenByHash(tokenHash);
  }

  private async issueTokenPair(user: AuthenticatedUser): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = this.computeExpiryDate(refreshExpiresIn);

    await this.authRepository.insertRefreshToken({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private computeExpiryDate(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';
    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    } as const;
    const multiplier = multipliers[unit];
    if (multiplier === undefined) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    return new Date(Date.now() + value * multiplier);
  }
}

import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { departments, organizations, passwordResetTokens, refreshTokens, userRoles, users } from '@ecosphere/db';
import { BaseRepository } from './base.repository';

@Injectable()
export class AuthRepository extends BaseRepository {
  findActiveUserByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: and(eq(users.email, email.toLowerCase()), eq(users.isActive, true)),
    });
  }

  findUserByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
  }

  findUserById(userId: string) {
    return this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });
  }

  findActiveRolesByUserId(userId: string) {
    return this.db.query.userRoles.findMany({
      where: and(eq(userRoles.userId, userId), isNull(userRoles.validTo)),
    });
  }

  findValidRefreshToken(tokenHash: string) {
    return this.db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    });
  }

  revokeRefreshToken(tokenId: string) {
    return this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, tokenId));
  }

  revokeRefreshTokenByHash(tokenHash: string) {
    return this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  insertRefreshToken(values: typeof refreshTokens.$inferInsert) {
    return this.db.insert(refreshTokens).values(values);
  }

  createUser(values: typeof users.$inferInsert) {
    return this.db
      .insert(users)
      .values({ ...values, email: values.email.toLowerCase() })
      .returning();
  }

  assignUserRole(values: typeof userRoles.$inferInsert) {
    return this.db.insert(userRoles).values(values).onConflictDoNothing().returning();
  }

  updateUserPassword(userId: string, passwordHash: string) {
    return this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  updateUserProfile(userId: string, data: { firstName: string; lastName: string }) {
    return this.db
      .update(users)
      .set({ firstName: data.firstName, lastName: data.lastName, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  insertPasswordResetToken(values: typeof passwordResetTokens.$inferInsert) {
    return this.db.insert(passwordResetTokens).values(values);
  }

  findValidPasswordResetToken(tokenHash: string) {
    return this.db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    });
  }

  markPasswordResetTokenUsed(tokenId: string) {
    return this.db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  findOrganizationBySlug(slug: string) {
    return this.db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    });
  }

  findFirstDepartment(orgId: string) {
    return this.db.query.departments.findFirst({
      where: eq(departments.organizationId, orgId),
    });
  }
}

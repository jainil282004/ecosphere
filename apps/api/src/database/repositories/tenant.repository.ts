import { Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { departments, organizations, userRoles, users } from '@ecosphere/db';
import { BaseRepository } from './base.repository';

@Injectable()
export class TenantRepository extends BaseRepository {
  listOrganizations() {
    return this.db.query.organizations.findMany({
      orderBy: (table, { asc }) => [asc(table.name)],
    });
  }

  findOrganizationById(id: string) {
    return this.db.query.organizations.findFirst({
      where: eq(organizations.id, id),
    });
  }

  createOrganization(values: typeof organizations.$inferInsert) {
    return this.db.insert(organizations).values(values).returning();
  }

  listDepartments(orgId: string) {
    return this.db.query.departments.findMany({
      where: and(eq(departments.organizationId, orgId), eq(departments.isActive, true)),
      orderBy: (table, { asc }) => [asc(table.name)],
    });
  }

  createDepartment(values: typeof departments.$inferInsert) {
    return this.db.insert(departments).values(values).returning();
  }

  listOrgRoleAssignments(orgId: string) {
    return this.db.query.userRoles.findMany({
      where: and(eq(userRoles.organizationId, orgId), isNull(userRoles.validTo)),
    });
  }

  findUsersByIds(userIds: string[]) {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.db.query.users.findMany({
      where: inArray(users.id, userIds),
    });
  }

  findUserByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  createUser(values: typeof users.$inferInsert) {
    return this.db.insert(users).values(values).returning();
  }

  assignRole(values: typeof userRoles.$inferInsert) {
    return this.db.insert(userRoles).values(values).onConflictDoNothing().returning();
  }

  findRolesByUserId(userId: string) {
    return this.db.query.userRoles.findMany({
      where: and(eq(userRoles.userId, userId), isNull(userRoles.validTo)),
    });
  }
}

import { ForbiddenException, Injectable } from '@nestjs/common';
import { assignRoleSchema, canAssignInternalRole } from '@ecosphere/shared';
import { TenantRepository } from '../../database/repositories/tenant.repository';
import type { AuthenticatedUser } from '../../common/types/request.types';

@Injectable()
export class UsersService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async listOrgUsers(orgId: string) {
    const roleAssignments = await this.tenantRepository.listOrgRoleAssignments(orgId);
    const userIds = Array.from(new Set(roleAssignments.map((assignment) => assignment.userId)));

    if (userIds.length === 0) {
      return [];
    }

    const userRows = await this.tenantRepository.findUsersByIds(userIds);
    const userById = new Map(userRows.map((user) => [user.id, user]));

    const userMap = new Map<
      string,
      {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        roles: Array<{ role: string; departmentId: string | null }>;
      }
    >();

    for (const assignment of roleAssignments) {
      const user = userById.get(assignment.userId);
      if (!user) {
        continue;
      }

      const existing = userMap.get(assignment.userId);
      if (existing) {
        existing.roles.push({
          role: assignment.role,
          departmentId: assignment.departmentId,
        });
      } else {
        userMap.set(assignment.userId, {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: [{ role: assignment.role, departmentId: assignment.departmentId }],
        });
      }
    }

    return Array.from(userMap.values());
  }

  async listOrgDirectory(orgId: string) {
    const [users, departments] = await Promise.all([
      this.listOrgUsers(orgId),
      this.tenantRepository.listDepartments(orgId),
    ]);

    const departmentById = new Map(departments.map((department) => [department.id, department.name]));
    const rolePriority = [
      'org_admin',
      'esg_manager',
      'dept_head',
      'auditor',
      'employee',
    ] as const;
    const priorityFor = (role: string) => {
      const index = rolePriority.indexOf(role as (typeof rolePriority)[number]);
      return index === -1 ? 999 : index;
    };

    return users
      .map((user) => {
        const sortedRoles = [...user.roles].sort(
          (left, right) => priorityFor(left.role) - priorityFor(right.role),
        );
        const primaryRole = sortedRoles[0]?.role ?? 'employee';
        const departmentId =
          sortedRoles.find((role) => role.departmentId)?.departmentId ?? null;

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          primaryRole,
          departmentName: departmentId ? departmentById.get(departmentId) ?? 'Unassigned' : 'Organization',
        };
      })
      .sort((left, right) => left.firstName.localeCompare(right.firstName));
  }

  async assignRole(orgId: string, actor: AuthenticatedUser, body: unknown) {
    const input = assignRoleSchema.parse(body);
    const actorRoles = actor.roles.map((assignment) => assignment.role);

    if (!canAssignInternalRole(actorRoles, input.role)) {
      throw new ForbiddenException(
        'Vertical privilege escalation blocked: insufficient tier to assign this role.',
      );
    }

    if (input.role !== 'super_admin' && input.userId === actor.id && input.role !== 'employee') {
      throw new ForbiddenException('You cannot elevate your own role.');
    }

    const [assignment] = await this.tenantRepository.assignRole({
      userId: input.userId,
      role: input.role,
      organizationId: input.role === 'super_admin' ? null : orgId,
      departmentId: input.departmentId ?? null,
    });

    return assignment;
  }

  async createEmployee(orgId: string, actor: AuthenticatedUser, body: unknown) {
    const { createEmployeeSchema } = await import('@ecosphere/shared');
    const input = createEmployeeSchema.parse(body);

    const actorRoles = actor.roles.map((assignment) => assignment.role);
    if (!canAssignInternalRole(actorRoles, input.role)) {
      throw new ForbiddenException(
        'Vertical privilege escalation blocked: insufficient tier to assign this role.',
      );
    }

    let user = await this.tenantRepository.findUserByEmail(input.email);

    if (!user) {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('Password123!', 12);
      const [createdUser] = await this.tenantRepository.createUser({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
      });
      user = createdUser;
    }

    if (!user) {
      throw new Error('Failed to create or locate user.');
    }

    // Assign the requested role
    await this.tenantRepository.assignRole({
      userId: user.id,
      role: input.role,
      organizationId: orgId,
      departmentId: input.departmentId ?? null,
    });

    // Also assign base employee role if they are getting a higher role
    if (input.role !== 'employee') {
      await this.tenantRepository.assignRole({
        userId: user.id,
        role: 'employee',
        organizationId: orgId,
        departmentId: input.departmentId ?? null,
      });
    }

    return user;
  }

  async getMeInOrg(orgId: string, userId: string) {
    const userRows = await this.tenantRepository.findUsersByIds([userId]);
    const user = userRows[0] ?? null;
    const roles = await this.tenantRepository.findRolesByUserId(userId);

    const orgRoles = roles.filter(
      (role) => role.organizationId === orgId || role.role === 'super_admin',
    );

    return {
      user,
      roles: orgRoles,
    };
  }
}

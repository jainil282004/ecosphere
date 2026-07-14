import type { Permission, Role } from '@ecosphere/shared';
import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Array<{
    id: string;
    role: Role;
    organizationId: string | null;
    departmentId: string | null;
  }>;
  permissions: Permission[];
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  orgId?: string;
}

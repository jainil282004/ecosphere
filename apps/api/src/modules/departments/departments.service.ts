import { Injectable } from '@nestjs/common';
import { createDepartmentSchema } from '@ecosphere/shared';
import { TenantRepository } from '../../database/repositories/tenant.repository';

@Injectable()
export class DepartmentsService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  list(orgId: string) {
    return this.tenantRepository.listDepartments(orgId);
  }

  async create(orgId: string, body: unknown) {
    const input = createDepartmentSchema.parse(body);
    const [department] = await this.tenantRepository.createDepartment({
      organizationId: orgId,
      name: input.name,
      code: input.code.toUpperCase(),
    });
    return department;
  }
}

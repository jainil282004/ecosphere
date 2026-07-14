import { Injectable, NotFoundException } from '@nestjs/common';
import { createOrganizationSchema } from '@ecosphere/shared';
import { TenantRepository } from '../../database/repositories/tenant.repository';

@Injectable()
export class OrganizationsService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async listAll() {
    return this.tenantRepository.listOrganizations();
  }

  async getById(id: string) {
    const organization = await this.tenantRepository.findOrganizationById(id);

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    return organization;
  }

  async create(body: unknown) {
    const input = createOrganizationSchema.parse(body);
    const [organization] = await this.tenantRepository.createOrganization({
      name: input.name,
      slug: input.slug,
      industry: input.industry,
      country: input.country,
    });

    return organization;
  }

  async listForUser(_userId: string, roleRows: Array<{ organizationId: string | null }>) {
    const orgIds = roleRows
      .map((row) => row.organizationId)
      .filter((id): id is string => id !== null);

    if (orgIds.length === 0) {
      return this.listAll();
    }

    const uniqueOrgIds = Array.from(new Set(orgIds));
    const results = [];

    for (const orgId of uniqueOrgIds) {
      const organization = await this.getById(orgId);
      results.push(organization);
    }

    return results;
  }
}

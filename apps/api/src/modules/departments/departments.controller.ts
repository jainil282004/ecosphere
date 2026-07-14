import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import {
  JwtAuthGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common/guards/auth.guards';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('orgs/:orgId/departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  list(@Param('orgId') orgId: string) {
    return this.departmentsService.list(orgId);
  }

  @Post()
  @RequirePermissions('manage_departments')
  create(@Param('orgId') orgId: string, @Body() body: unknown) {
    return this.departmentsService.create(orgId, body);
  }
}

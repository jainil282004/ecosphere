import { Global, Module } from '@nestjs/common';

import {

  JwtAuthGuard,

  PermissionsGuard,

  RolesGuard,

  TenantGuard,

} from './guards/auth.guards';

import {

  RoleAssignmentGuard,

  SecurityRolesGuard,

  SelfOrManagerGuard,

  TenantIsolationGuard,

} from './guards/rbac.guard';



@Global()

@Module({

  providers: [

    JwtAuthGuard,

    RolesGuard,

    PermissionsGuard,

    TenantGuard,

    TenantIsolationGuard,

    SecurityRolesGuard,

    RoleAssignmentGuard,

    SelfOrManagerGuard,

  ],

  exports: [

    JwtAuthGuard,

    RolesGuard,

    PermissionsGuard,

    TenantGuard,

    TenantIsolationGuard,

    SecurityRolesGuard,

    RoleAssignmentGuard,

    SelfOrManagerGuard,

  ],

})

export class CommonModule {}



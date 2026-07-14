# EcoSphere — Security Engineering & RBAC (Step 2)

## Stateless JWT Authentication (HttpOnly Cookies)

Access and refresh tokens are **never returned in JSON response bodies**. Both are stored as cookies:

| Cookie | Contents | Flags |
|--------|----------|-------|
| `ecosphere_access` | Signed JWT (15m) | `HttpOnly`, `SameSite=Strict`, `Secure`* |
| `ecosphere_refresh` | Opaque rotation token (7d) | `HttpOnly`, `SameSite=Strict`, `Secure`* |

\* Set `COOKIE_SECURE=false` in `.env` for local HTTP development only.

### Auth flow

```
POST /auth/login   → sets both cookies, returns { user }
POST /auth/refresh → rotates cookies, returns { authenticated: true }
GET  /auth/me      → reads JWT from ecosphere_access cookie
POST /auth/logout  → revokes refresh token + clears cookies
```

JWT extraction (`jwt.strategy.ts`):

```typescript
ExtractJwt.fromExtractors([
  (req) => req.cookies?.['ecosphere_access'] ?? null,  // primary
  ExtractJwt.fromAuthHeaderAsBearerToken(),             // Swagger fallback
])
```

The frontend sends `credentials: 'include'` on every request — no `localStorage` token storage.

---

## RBAC Security Roles

| Security Role | Internal DB Roles | Rank |
|---------------|-------------------|------|
| `System_Admin` | `super_admin`, `org_admin` | 4 |
| `ESG_Manager` | `esg_manager`, `dept_head` | 3 |
| `Auditor` | `auditor` | 2 |
| `Employee` | `employee` | 1 |

Defined in `packages/shared/src/constants/security-roles.ts`.

---

## Guard Stack (Route Protection Order)

Every org-scoped route applies guards **in this order**:

```
1. JwtAuthGuard           → valid JWT in HttpOnly cookie (401 if missing)
2. TenantIsolationGuard   → horizontal escalation prevention
3. SecurityRolesGuard     → vertical tier check (optional @RequireSecurityRoles)
4. PermissionsGuard       → fine-grained permission check
5. RoleAssignmentGuard    → role-assignment endpoints only
```

---

## Horizontal Privilege Escalation Prevention

**Attack:** Employee of Org A accesses `/orgs/{orgB-id}/...`

**Defense:** `TenantIsolationGuard`

```typescript
// apps/api/src/common/guards/rbac.guard.ts
const belongsToOrg = request.user.roles.some(
  (assignment) => assignment.organizationId === orgId,
);
if (!belongsToOrg && !isSystemAdmin) {
  throw new ForbiddenException(
    'Horizontal privilege escalation blocked: you are not a member of this organization.',
  );
}
```

**Example — organization detail:**

```typescript
@Get(':orgId')
@UseGuards(TenantIsolationGuard)  // ← blocks cross-org access
getOne(@Param('orgId') orgId: string) { ... }
```

**Example — user profile (no userId param):**

```typescript
@Get('me')
me(@CurrentUser() user: AuthenticatedUser) {
  return this.usersService.getMeInOrg(orgId, user.id);  // ← always actor's own ID
}
```

---

## Vertical Privilege Escalation Prevention

**Attack:** Employee calls admin endpoint or assigns themselves `System_Admin`

**Defense layers:**

### 1. Security tier decorator

```typescript
@Post('emission-factors')
@SecureManagerRoute('manage_emission_factors')
// Requires ESG_Manager (rank ≥ 3) + permission
createFactor(...) { ... }
```

### 2. Role assignment guard + service validation

```typescript
@Post('roles')
@SecureRoleAssignmentRoute()
// Guards: TenantIsolation + SecurityRoles(System_Admin) + RoleAssignmentGuard
assignRole(@CurrentUser() user, @Body() body) {
  return this.usersService.assignRole(orgId, user, body);
}
```

```typescript
// users.service.ts — defense in depth
if (!canAssignInternalRole(actorRoles, input.role)) {
  throw new ForbiddenException('Vertical privilege escalation blocked');
}
if (input.userId === actor.id && input.role !== 'employee') {
  throw new ForbiddenException('You cannot elevate your own role.');
}
```

### 3. Platform-only routes

```typescript
@Post()
@RequireSecurityRoles('System_Admin')
@RequireRoles('super_admin')
create(@Body() body: unknown) { ... }
```

---

## Route Guarding Reference

| Route | Guards | Escalation Prevented |
|-------|--------|----------------------|
| `POST /organizations` | Jwt + SecurityRoles(System_Admin) + Roles(super_admin) | Employee → platform admin |
| `GET /organizations/:orgId` | Jwt + TenantIsolation | Cross-org data access |
| `POST /orgs/:orgId/users/roles` | Jwt + Tenant + Security + Permissions + RoleAssignment | Self-elevation, cross-tier assign |
| `POST /orgs/:orgId/environmental/emission-factors` | SecureManagerRoute | Employee → manager config |
| `POST /orgs/:orgId/environmental/carbon-transactions` | SecureOrgRoute(submit_activities) | Cross-org + missing permission |
| `GET /orgs/:orgId/governance/audit-logs` | Jwt + Tenant + Permissions(manage_audits) | Employee → audit access |

---

## Composite Decorators

```typescript
SecureOrgRoute(...permissions)        // any authenticated org member with permission
SecureManagerRoute(...permissions)    // ESG_Manager tier minimum
SecureOrgAdminRoute(...permissions)   // System_Admin tier minimum
SecureRoleAssignmentRoute()           // admin role assignment with escalation checks
```

Import from `apps/api/src/common/decorators/auth.decorators.ts`.

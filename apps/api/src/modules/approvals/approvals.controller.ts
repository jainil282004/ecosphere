import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { approvalDecisionSchema } from '@ecosphere/shared';
import { ApprovalsService } from './approvals.service';
import { CurrentUser } from '../../common/decorators/auth.decorators';
import {
  JwtAuthGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common/guards/auth.guards';
import { RequirePermissions } from '../../common/decorators/auth.decorators';
import type { AuthenticatedUser } from '../../common/types/request.types';

@ApiTags('approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('orgs/:orgId/approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('inbox')
  @RequirePermissions('approve_submissions')
  inbox(@Param('orgId') orgId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.approvalsService.listInbox(orgId, user);
  }

  @Post(':id/decide')
  @RequirePermissions('approve_submissions')
  decide(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    const input = approvalDecisionSchema.parse(body);
    return this.approvalsService.decide(orgId, id, user, input.decision, input.comment);
  }
}

import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SocialService } from './social.service';
import { CurrentUser, RequirePermissions } from '../../common/decorators/auth.decorators';
import {
  JwtAuthGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common/guards/auth.guards';
import type { AuthenticatedUser } from '../../common/types/request.types';

@ApiTags('social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('orgs/:orgId/social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('csr')
  listCsr(@Param('orgId') orgId: string, @Query() query: unknown) {
    return this.socialService.listCsrActivities(orgId, query);
  }

  @Post('csr')
  @RequirePermissions('submit_activities')
  createCsr(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.socialService.createCsrActivity(orgId, user.id, body);
  }

  @Get('csr/:id')
  getCsr(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.socialService.getCsrActivity(orgId, id);
  }

  @Get('challenges')
  listChallenges(@Param('orgId') orgId: string) {
    return this.socialService.listChallenges(orgId);
  }

  @Post('challenges')
  @RequirePermissions('manage_goals')
  createChallenge(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.socialService.createChallenge(orgId, user.id, body);
  }

  @Post('challenges/participate')
  @RequirePermissions('submit_activities')
  participate(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.socialService.participateInChallenge(orgId, user.id, body);
  }

  @Get('dei')
  @RequirePermissions('view_reports', 'manage_compliance')
  listDei(@Param('orgId') orgId: string) {
    return this.socialService.listDeiSnapshots(orgId);
  }

  @Post('dei')
  @RequirePermissions('manage_compliance')
  createDei(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.socialService.createDeiSnapshot(orgId, user.id, body);
  }
}

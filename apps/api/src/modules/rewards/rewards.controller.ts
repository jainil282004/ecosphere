import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { CurrentUser, RequirePermissions } from '../../common/decorators/auth.decorators';
import {
  JwtAuthGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common/guards/auth.guards';
import type { AuthenticatedUser } from '../../common/types/request.types';

@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('orgs/:orgId/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  list(@Param('orgId') orgId: string) {
    return this.rewardsService.listRewards(orgId);
  }

  @Post()
  @RequirePermissions('manage_rewards')
  create(@Param('orgId') orgId: string, @Body() body: unknown) {
    return this.rewardsService.createReward(orgId, body);
  }

  @Post('redeem')
  @RequirePermissions('redeem_rewards')
  redeem(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.rewardsService.redeemReward(orgId, user.id, body);
  }
}

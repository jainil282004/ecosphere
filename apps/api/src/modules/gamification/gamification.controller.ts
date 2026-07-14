import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { CurrentUser, RequirePermissions } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard, PermissionsGuard, TenantGuard } from '../../common/guards/auth.guards';
import type { AuthenticatedUser } from '../../common/types/request.types';

@ApiTags('gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('orgs/:orgId/gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('me')
  @RequirePermissions('view_own_gamification')
  myProfile(@Param('orgId') orgId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.gamificationService.getProfile(orgId, user.id);
  }

  @Get('users/:userId')
  @RequirePermissions('approve_submissions', 'manage_users', 'view_reports')
  userProfile(@Param('orgId') orgId: string, @Param('userId') userId: string) {
    return this.gamificationService.getProfile(orgId, userId);
  }

  @Post('award')
  @RequirePermissions('approve_submissions', 'manage_users')
  awardXp(@Param('orgId') orgId: string, @Body() body: unknown) {
    return this.gamificationService.awardXp(orgId, body);
  }

  @Get('badges')
  listBadges(@Param('orgId') orgId: string) {
    return this.gamificationService.listBadges(orgId);
  }

  @Get('leaderboard')
  leaderboard(@Param('orgId') orgId: string) {
    return this.gamificationService.getLeaderboard(orgId);
  }

  @Get('streaks')
  streaks(@Param('orgId') orgId: string) {
    return this.gamificationService.getStreakLeaderboard(orgId);
  }
}

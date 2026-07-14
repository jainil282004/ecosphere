import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { awardXpSchema } from '@ecosphere/shared';
import { DomainRepository } from '../../database/repositories/domain.repository';
import { LedgerRepository } from '../../database/repositories/ledger.repository';
import { TenantRepository } from '../../database/repositories/tenant.repository';

@Injectable()
export class GamificationService {
  constructor(
    private readonly ledgerRepository: LedgerRepository,
    private readonly domainRepository: DomainRepository,
    private readonly tenantRepository: TenantRepository,
  ) {}

  async getProfile(orgId: string, userId: string) {
    const xpResult = await this.ledgerRepository.getXpBalance(orgId, userId);
    const pointsResult = await this.ledgerRepository.getPointsBalanceDirect(orgId, userId);
    const streak = await this.domainRepository.getParticipationStreak(orgId, userId);

    const totalXp = Number(xpResult[0]?.total ?? 0);
    const totalPoints = Number(pointsResult[0]?.total ?? 0);
    const level = Math.floor(totalXp / 100) + 1;

    const earnedBadges = await this.ledgerRepository.listUserBadges(orgId, userId);

    return {
      userId,
      totalXp,
      totalPoints,
      level,
      currentStreakWeeks: streak?.currentStreakWeeks ?? 0,
      longestStreakWeeks: streak?.longestStreakWeeks ?? 0,
      badges: earnedBadges.map((badge) => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        earnedAt: badge.earnedAt.toISOString(),
      })),
    };
  }

  async awardXp(orgId: string, body: unknown) {
    const input = awardXpSchema.parse(body);
    const users = await this.tenantRepository.findUsersByIds([input.userId]);
    if (!users[0]) {
      throw new NotFoundException('Employee not found.');
    }

    const sourceId = randomUUID();

    await this.ledgerRepository.transaction(async (tx) => {
      await this.ledgerRepository.creditXp(tx, {
        organizationId: orgId,
        userId: input.userId,
        entryType: 'credit',
        amount: input.xpAmount,
        sourceType: 'manual_adjustment',
        sourceId,
        description: input.reason,
      });

      if (input.pointsAmount > 0) {
        await this.ledgerRepository.creditPoints(tx, {
          organizationId: orgId,
          userId: input.userId,
          entryType: 'credit',
          amount: input.pointsAmount,
          sourceType: 'manual_adjustment',
          sourceId,
          description: input.reason,
        });
      }
    });

    return this.getProfile(orgId, input.userId);
  }

  listBadges(orgId: string) {
    return this.ledgerRepository.listActiveBadges(orgId);
  }

  getLeaderboard(orgId: string) {
    return this.ledgerRepository.getLeaderboard(orgId);
  }

  getStreakLeaderboard(orgId: string) {
    return this.domainRepository.listParticipationStreaks(orgId);
  }
}

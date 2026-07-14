import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createRewardSchema, redeemRewardSchema } from '@ecosphere/shared';
import { RewardsRepository } from '../../database/repositories/rewards.repository';
import { ApprovalsService } from '../approvals/approvals.service';

@Injectable()
export class RewardsService {
  constructor(
    private readonly rewardsRepository: RewardsRepository,
    private readonly approvalsService: ApprovalsService,
  ) {}

  async listRewards(orgId: string) {
    const catalog = await this.rewardsRepository.listActiveRewards(orgId);

    const enriched = [];
    for (const reward of catalog) {
      const inventory = await this.rewardsRepository.findInventoryByRewardId(reward.id);
      enriched.push({
        ...reward,
        stockRemaining: inventory?.stockRemaining ?? 0,
      });
    }
    return enriched;
  }

  async createReward(orgId: string, body: unknown) {
    const input = createRewardSchema.parse(body);

    const [reward] = await this.rewardsRepository.createReward({
      organizationId: orgId,
      name: input.name,
      description: input.description,
      pointsCost: input.pointsCost,
    });

    if (!reward) {
      throw new Error('Failed to create reward.');
    }

    await this.rewardsRepository.createInventory({
      organizationId: orgId,
      rewardId: reward.id,
      stockRemaining: input.stockQuantity,
      version: 0,
    });

    return reward;
  }

  async redeemReward(orgId: string, userId: string, body: unknown) {
    const input = redeemRewardSchema.parse(body);

    return this.rewardsRepository.transaction(async (tx) => {
      const reward = await this.rewardsRepository.findReward(orgId, input.rewardId);

      if (!reward || !reward.isActive) {
        throw new NotFoundException('Reward not found.');
      }

      const inventoryRows = await this.rewardsRepository.lockInventory(tx, orgId, reward.id);
      const inventory = inventoryRows[0];

      if (!inventory || inventory.stockRemaining <= 0) {
        throw new BadRequestException('Reward is out of stock.');
      }

      const [redemption] = await this.rewardsRepository.createRedemption(tx, {
        organizationId: orgId,
        rewardId: reward.id,
        userId,
        snapshotPointsCost: reward.pointsCost,
        status: 'submitted',
      });

      if (!redemption) {
        throw new Error('Failed to create reward redemption.');
      }

      await this.rewardsRepository.decrementInventory(
        tx,
        inventory.id,
        inventory.stockRemaining - 1,
        inventory.version,
      );

      await this.approvalsService.createApprovalRecord(
        orgId,
        'reward_redemption',
        redemption.id,
        userId,
      );

      return redemption;
    });
  }
}

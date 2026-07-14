import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { rewardInventory, rewardRedemptions, rewards } from '@ecosphere/db';
import type { DbExecutor } from '@ecosphere/db';
import { BaseRepository } from './base.repository';

@Injectable()
export class RewardsRepository extends BaseRepository {
  listActiveRewards(orgId: string) {
    return this.db.query.rewards.findMany({
      where: and(eq(rewards.organizationId, orgId), eq(rewards.isActive, true)),
    });
  }

  findInventoryByRewardId(rewardId: string) {
    return this.db.query.rewardInventory.findFirst({
      where: eq(rewardInventory.rewardId, rewardId),
    });
  }

  createReward(values: typeof rewards.$inferInsert) {
    return this.db.insert(rewards).values(values).returning();
  }

  createInventory(values: typeof rewardInventory.$inferInsert) {
    return this.db.insert(rewardInventory).values(values);
  }

  findReward(orgId: string, rewardId: string) {
    return this.db.query.rewards.findFirst({
      where: and(eq(rewards.id, rewardId), eq(rewards.organizationId, orgId)),
    });
  }

  lockInventory(executor: DbExecutor, orgId: string, rewardId: string) {
    return executor
      .select()
      .from(rewardInventory)
      .where(
        and(eq(rewardInventory.rewardId, rewardId), eq(rewardInventory.organizationId, orgId)),
      )
      .for('update');
  }

  decrementInventory(
    executor: DbExecutor,
    inventoryId: string,
    stockRemaining: number,
    version: number,
  ) {
    return executor
      .update(rewardInventory)
      .set({
        stockRemaining,
        version: version + 1,
        updatedAt: new Date(),
      })
      .where(eq(rewardInventory.id, inventoryId));
  }

  createRedemption(executor: DbExecutor, values: typeof rewardRedemptions.$inferInsert) {
    return executor.insert(rewardRedemptions).values(values).returning();
  }

  findRedemption(entityId: string) {
    return this.db.query.rewardRedemptions.findFirst({
      where: eq(rewardRedemptions.id, entityId),
    });
  }
}

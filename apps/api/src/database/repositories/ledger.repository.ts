import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import {
  badges,
  carbonLedger,
  carbonTransactions,
  csrActivities,
  pointsLedger,
  userBadges,
  users,
  xpLedger,
} from '@ecosphere/db';
import type { DbExecutor } from '@ecosphere/db';
import type { DashboardFilters } from '@ecosphere/shared';
import { BaseRepository } from './base.repository';
import { applyDateFilter } from './filters.helper';

@Injectable()
export class LedgerRepository extends BaseRepository {
  creditXp(executor: DbExecutor, values: typeof xpLedger.$inferInsert) {
    return executor.insert(xpLedger).values(values).onConflictDoNothing();
  }

  creditPoints(executor: DbExecutor, values: typeof pointsLedger.$inferInsert) {
    return executor.insert(pointsLedger).values(values).onConflictDoNothing();
  }

  creditCarbon(executor: DbExecutor, values: typeof carbonLedger.$inferInsert) {
    return executor.insert(carbonLedger).values(values).onConflictDoNothing();
  }

  getPointsBalance(executor: DbExecutor, orgId: string, userId: string) {
    return executor
      .select({
        balance: sql<number>`COALESCE(SUM(CASE WHEN ${pointsLedger.entryType} = 'credit' THEN ${pointsLedger.amount} ELSE -${pointsLedger.amount} END), 0)`,
      })
      .from(pointsLedger)
      .where(and(eq(pointsLedger.organizationId, orgId), eq(pointsLedger.userId, userId)));
  }

  getXpBalance(orgId: string, userId: string) {
    return this.db
      .select({
        total: sql<number>`COALESCE(SUM(CASE WHEN ${xpLedger.entryType} = 'credit' THEN ${xpLedger.amount} ELSE -${xpLedger.amount} END), 0)`,
      })
      .from(xpLedger)
      .where(and(eq(xpLedger.organizationId, orgId), eq(xpLedger.userId, userId)));
  }

  getPointsBalanceDirect(orgId: string, userId: string) {
    return this.db
      .select({
        total: sql<number>`COALESCE(SUM(CASE WHEN ${pointsLedger.entryType} = 'credit' THEN ${pointsLedger.amount} ELSE -${pointsLedger.amount} END), 0)`,
      })
      .from(pointsLedger)
      .where(and(eq(pointsLedger.organizationId, orgId), eq(pointsLedger.userId, userId)));
  }

  listActiveBadges(orgId: string) {
    return this.db.query.badges.findMany({
      where: and(eq(badges.organizationId, orgId), eq(badges.isActive, true)),
    });
  }

  countApprovedCsr(executor: DbExecutor, orgId: string, userId: string) {
    return executor
      .select({ count: sql<number>`count(*)` })
      .from(csrActivities)
      .where(
        and(
          eq(csrActivities.organizationId, orgId),
          eq(csrActivities.submittedById, userId),
          eq(csrActivities.status, 'approved'),
        ),
      );
  }

  countApprovedCarbon(executor: DbExecutor, orgId: string, userId: string) {
    return executor
      .select({ count: sql<number>`count(*)` })
      .from(carbonTransactions)
      .where(
        and(
          eq(carbonTransactions.organizationId, orgId),
          eq(carbonTransactions.submittedById, userId),
          eq(carbonTransactions.status, 'approved'),
        ),
      );
  }

  awardBadge(executor: DbExecutor, values: typeof userBadges.$inferInsert) {
    return executor.insert(userBadges).values(values).onConflictDoNothing();
  }

  listUserBadges(orgId: string, userId: string) {
    return this.db
      .select({
        id: badges.id,
        name: badges.name,
        description: badges.description,
        earnedAt: userBadges.earnedAt,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(and(eq(userBadges.organizationId, orgId), eq(userBadges.userId, userId)));
  }

  getLeaderboard(orgId: string) {
    return this.db
      .select({
        userId: xpLedger.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        totalXp: sql<number>`COALESCE(SUM(CASE WHEN ${xpLedger.entryType} = 'credit' THEN ${xpLedger.amount} ELSE -${xpLedger.amount} END), 0)`,
      })
      .from(xpLedger)
      .innerJoin(users, eq(xpLedger.userId, users.id))
      .where(eq(xpLedger.organizationId, orgId))
      .groupBy(xpLedger.userId, users.firstName, users.lastName)
      .orderBy(sql`COALESCE(SUM(CASE WHEN ${xpLedger.entryType} = 'credit' THEN ${xpLedger.amount} ELSE -${xpLedger.amount} END), 0) DESC`)
      .limit(20);
  }

  getCarbonLedgerTotal(orgId: string, filters?: DashboardFilters) {
    const conditions = [eq(carbonLedger.organizationId, orgId)];
    const dateFilter = applyDateFilter(carbonLedger.recordedAt, filters);
    if (dateFilter) conditions.push(dateFilter);

    return this.db
      .select({
        total: sql<string>`COALESCE(SUM(CASE WHEN ${carbonLedger.entryType} = 'credit' THEN ${carbonLedger.co2eKg} ELSE -${carbonLedger.co2eKg} END), 0)`,
      })
      .from(carbonLedger)
      .where(and(...conditions));
  }
}

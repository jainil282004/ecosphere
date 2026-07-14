import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import {
  carbonTransactions,
  challengeParticipations,
  challenges,
  csrActivities,
  departments,
  emissionFactors,
  users,
} from '@ecosphere/db';
import { BaseRepository } from './base.repository';

@Injectable()
export class ActivityRepository extends BaseRepository {
  listEmissionFactors(orgId: string, scope?: string) {
    return this.db.query.emissionFactors.findMany({
      where: scope
        ? and(eq(emissionFactors.organizationId, orgId), eq(emissionFactors.scope, scope as 'scope_1' | 'scope_2' | 'scope_3'))
        : eq(emissionFactors.organizationId, orgId),
      orderBy: [desc(emissionFactors.effectiveFrom)],
    });
  }

  findEmissionFactor(orgId: string, factorId: string) {
    return this.db.query.emissionFactors.findFirst({
      where: and(eq(emissionFactors.id, factorId), eq(emissionFactors.organizationId, orgId)),
    });
  }

  createEmissionFactor(values: typeof emissionFactors.$inferInsert) {
    return this.db.insert(emissionFactors).values(values).returning();
  }

  listCarbonTransactions(orgId: string, limit: number, offset: number, scope?: string) {
    return this.db.query.carbonTransactions.findMany({
      where: scope
        ? and(
            eq(carbonTransactions.organizationId, orgId),
            eq(carbonTransactions.scope, scope as 'scope_1' | 'scope_2' | 'scope_3'),
          )
        : eq(carbonTransactions.organizationId, orgId),
      orderBy: [desc(carbonTransactions.createdAt)],
      limit,
      offset,
    });
  }

  findCarbonTransaction(orgId: string, id: string) {
    return this.db.query.carbonTransactions.findFirst({
      where: and(eq(carbonTransactions.id, id), eq(carbonTransactions.organizationId, orgId)),
    });
  }

  createCarbonTransaction(values: typeof carbonTransactions.$inferInsert) {
    return this.db.insert(carbonTransactions).values(values).returning();
  }

  listCsrActivities(orgId: string, limit: number, offset: number) {
    return this.db
      .select({
        id: csrActivities.id,
        title: csrActivities.title,
        description: csrActivities.description,
        hoursContributed: csrActivities.hoursContributed,
        status: csrActivities.status,
        activityDate: csrActivities.activityDate,
        beneficiariesCount: csrActivities.beneficiariesCount,
        submittedByFirstName: users.firstName,
        submittedByLastName: users.lastName,
        departmentName: departments.name,
      })
      .from(csrActivities)
      .innerJoin(users, eq(csrActivities.submittedById, users.id))
      .innerJoin(departments, eq(csrActivities.departmentId, departments.id))
      .where(eq(csrActivities.organizationId, orgId))
      .orderBy(desc(csrActivities.createdAt))
      .limit(limit)
      .offset(offset);
  }

  findCsrActivity(orgId: string, id: string) {
    return this.db.query.csrActivities.findFirst({
      where: and(eq(csrActivities.id, id), eq(csrActivities.organizationId, orgId)),
    });
  }

  createCsrActivity(values: typeof csrActivities.$inferInsert) {
    return this.db.insert(csrActivities).values(values).returning();
  }

  listChallenges(orgId: string) {
    return this.db.query.challenges.findMany({
      where: eq(challenges.organizationId, orgId),
      orderBy: [desc(challenges.startDate)],
    });
  }

  findChallenge(orgId: string, challengeId: string) {
    return this.db.query.challenges.findFirst({
      where: and(eq(challenges.id, challengeId), eq(challenges.organizationId, orgId)),
    });
  }

  createChallenge(values: typeof challenges.$inferInsert) {
    return this.db.insert(challenges).values(values).returning();
  }

  createChallengeParticipation(values: typeof challengeParticipations.$inferInsert) {
    return this.db.insert(challengeParticipations).values(values).returning();
  }
}

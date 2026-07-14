import { Injectable, NotFoundException } from '@nestjs/common';

import {

  challengeParticipationSchema,

  createChallengeSchema,

  createCsrActivitySchema,

  createDeiSnapshotSchema,

  paginationSchema,

} from '@ecosphere/shared';

import { ActivityRepository } from '../../database/repositories/activity.repository';

import { DomainRepository } from '../../database/repositories/domain.repository';

import { ApprovalsService } from '../approvals/approvals.service';

import { NotificationsService } from '../notifications/notifications.service';



@Injectable()

export class SocialService {

  constructor(

    private readonly activityRepository: ActivityRepository,

    private readonly domainRepository: DomainRepository,

    private readonly approvalsService: ApprovalsService,

    private readonly notificationsService: NotificationsService,

  ) {}



  async listCsrActivities(orgId: string, query: unknown) {

    const { page, limit } = paginationSchema.parse(query);

    const data = await this.activityRepository.listCsrActivities(

      orgId,

      limit,

      (page - 1) * limit,

    );

    return { data, meta: { page, limit, total: data.length, totalPages: 1 } };

  }



  async createCsrActivity(orgId: string, userId: string, body: unknown) {

    const input = createCsrActivitySchema.parse(body);



    const [activity] = await this.activityRepository.createCsrActivity({

      organizationId: orgId,

      departmentId: input.departmentId,

      submittedById: userId,

      title: input.title,

      description: input.description,

      activityDate: new Date(input.activityDate),

      hoursContributed: input.hoursContributed.toString(),

      beneficiariesCount: input.beneficiariesCount ?? null,

      evidenceFileKey: input.evidenceFileKey ?? null,

      status: 'submitted',

    });



    if (!activity) {

      throw new Error('Failed to create CSR activity.');

    }



    await this.approvalsService.createApprovalRecord(

      orgId,

      'csr_activity',

      activity.id,

      userId,

    );



    await this.notificationsService.createNotification({

      organizationId: orgId,

      userId,

      type: 'approval_required',

      title: 'CSR activity submitted',

      body: `Your CSR activity "${activity.title}" has been submitted for approval.`,

      entityType: 'csr_activity',

      entityId: activity.id,

    });



    return activity;

  }



  async getCsrActivity(orgId: string, id: string) {

    const activity = await this.activityRepository.findCsrActivity(orgId, id);

    if (!activity) {

      throw new NotFoundException('CSR activity not found.');

    }

    return activity;

  }



  listChallenges(orgId: string) {

    return this.activityRepository.listChallenges(orgId);

  }



  async createChallenge(orgId: string, userId: string, body: unknown) {

    const input = createChallengeSchema.parse(body);

    const [challenge] = await this.activityRepository.createChallenge({

      organizationId: orgId,

      departmentId: input.departmentId ?? null,

      createdById: userId,

      title: input.title,

      description: input.description,

      startDate: new Date(input.startDate),

      endDate: new Date(input.endDate),

      xpReward: input.xpReward,

      pointsReward: input.pointsReward,

      status: 'active',

    });

    return challenge;

  }



  async participateInChallenge(orgId: string, userId: string, body: unknown) {

    const input = challengeParticipationSchema.parse(body);



    const challenge = await this.activityRepository.findChallenge(orgId, input.challengeId);



    if (!challenge) {

      throw new NotFoundException('Challenge not found.');

    }



    const [participation] = await this.activityRepository.createChallengeParticipation({

      organizationId: orgId,

      challengeId: challenge.id,

      userId,

      evidenceDescription: input.evidenceDescription,

      evidenceFileKey: input.evidenceFileKey ?? null,

      snapshotXpReward: challenge.xpReward,

      snapshotPointsReward: challenge.pointsReward,

      status: 'submitted',

    });



    if (!participation) {

      throw new Error('Failed to create challenge participation.');

    }



    await this.approvalsService.createApprovalRecord(

      orgId,

      'challenge_participation',

      participation.id,

      userId,

    );



    return participation;

  }



  listDeiSnapshots(orgId: string) {

    return this.domainRepository.listDeiSnapshots(orgId);

  }



  async createDeiSnapshot(orgId: string, userId: string, body: unknown) {

    const input = createDeiSnapshotSchema.parse(body);



    const [snapshot] = await this.domainRepository.createDeiSnapshot({

      organizationId: orgId,

      departmentId: input.departmentId ?? null,

      recordedById: userId,

      periodStart: new Date(input.periodStart),

      periodEnd: new Date(input.periodEnd),

      femalePercentage: input.femalePercentage.toFixed(2),

      underrepresentedPercentage: input.underrepresentedPercentage.toFixed(2),

      leadershipDiversityPercentage: input.leadershipDiversityPercentage.toFixed(2),

      totalHeadcount: input.totalHeadcount,

      notes: input.notes ?? null,

      status: 'submitted',

    });



    if (!snapshot) {

      throw new Error('Failed to create DEI snapshot.');

    }



    await this.approvalsService.createApprovalRecord(

      orgId,

      'dei_snapshot',

      snapshot.id,

      userId,

    );



    return snapshot;

  }

}



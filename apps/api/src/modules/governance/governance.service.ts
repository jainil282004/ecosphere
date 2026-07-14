import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import {

  createComplianceIssueSchema,

  createAuditSchema,

  createFrameworkMappingSchema,

  createFrameworkMetricSubmissionSchema,

  createPolicySchema,

  paginationSchema,

  policyAcknowledgementSchema,

  updateComplianceIssueStatusSchema,

} from '@ecosphere/shared';

import { DomainRepository } from '../../database/repositories/domain.repository';

import { GovernanceRepository } from '../../database/repositories/governance.repository';

import { ApprovalsService } from '../approvals/approvals.service';



@Injectable()

export class GovernanceService {

  constructor(

    private readonly governanceRepository: GovernanceRepository,

    private readonly domainRepository: DomainRepository,

    private readonly approvalsService: ApprovalsService,

  ) {}



  listComplianceIssues(orgId: string) {

    return this.governanceRepository.listComplianceIssues(orgId);

  }



  async createComplianceIssue(orgId: string, userId: string, body: unknown) {

    const input = createComplianceIssueSchema.parse(body);

    const [issue] = await this.governanceRepository.createComplianceIssue({

      organizationId: orgId,

      departmentId: input.departmentId ?? null,

      title: input.title,

      description: input.description,

      severity: input.severity,

      dueDate: input.dueDate ? new Date(input.dueDate) : null,

      createdById: userId,

      status: 'open',

    });



    if (!issue) {

      throw new Error('Failed to create compliance issue.');

    }



    await this.governanceRepository.insertStatusHistory({

      issueId: issue.id,

      fromStatus: null,

      toStatus: 'open',

      changedById: userId,

      comment: 'Issue created',

    });



    return issue;

  }



  async updateComplianceIssueStatus(

    orgId: string,

    issueId: string,

    userId: string,

    body: unknown,

  ) {

    const input = updateComplianceIssueStatusSchema.parse(body);

    const issue = await this.governanceRepository.findComplianceIssue(orgId, issueId);



    if (!issue) {

      throw new NotFoundException('Compliance issue not found.');

    }



    const [updated] = await this.governanceRepository.updateComplianceIssue(

      issueId,

      input.status,

    );



    await this.governanceRepository.insertStatusHistory({

      issueId,

      fromStatus: issue.status,

      toStatus: input.status,

      changedById: userId,

      comment: input.comment ?? null,

    });



    return updated;

  }



  listPolicies(orgId: string) {

    return this.governanceRepository.listPolicies(orgId);

  }



  async createPolicy(orgId: string, userId: string, body: unknown) {

    const input = createPolicySchema.parse(body);

    const [policy] = await this.governanceRepository.createPolicy({

      organizationId: orgId,

      title: input.title,

      content: input.content,

      version: input.version,

      effectiveFrom: new Date(input.effectiveFrom),

      requiresAcknowledgement: input.requiresAcknowledgement,

      createdById: userId,

    });

    return policy;

  }



  async acknowledgePolicy(orgId: string, userId: string, body: unknown) {

    const input = policyAcknowledgementSchema.parse(body);

    const policy = await this.governanceRepository.findPolicy(orgId, input.policyId);



    if (!policy) {

      throw new NotFoundException('Policy not found.');

    }



    const [acknowledgement] = await this.governanceRepository.acknowledgePolicy({

      organizationId: orgId,

      policyId: policy.id,

      userId,

      snapshotPolicyVersion: policy.version,

    });



    return acknowledgement;

  }



  listFrameworkMappings(orgId: string, framework?: string) {

    return this.domainRepository.listFrameworkMappings(

      orgId,

      framework as 'brsr' | 'gri' | 'csrd' | undefined,

    );

  }



  async createFrameworkMapping(orgId: string, body: unknown) {

    const input = createFrameworkMappingSchema.parse(body);

    const [mapping] = await this.domainRepository.createFrameworkMapping({

      organizationId: orgId,

      framework: input.framework,

      metricCode: input.metricCode,

      metricTitle: input.metricTitle,

      domain: input.domain,

      description: input.description,

      unit: input.unit,

      isMandatory: input.isMandatory,

    });

    return mapping;

  }



  listFrameworkSubmissions(orgId: string) {

    return this.domainRepository.listFrameworkSubmissions(orgId);

  }



  async submitFrameworkMetric(orgId: string, userId: string, body: unknown) {

    const input = createFrameworkMetricSubmissionSchema.parse(body);

    const mapping = await this.domainRepository.findFrameworkMapping(

      orgId,

      input.frameworkMappingId,

    );



    if (!mapping) {

      throw new NotFoundException('Framework mapping not found.');

    }



    const [submission] = await this.domainRepository.createFrameworkSubmission({

      organizationId: orgId,

      frameworkMappingId: mapping.id,

      submittedById: userId,

      reportingPeriodStart: new Date(input.reportingPeriodStart),

      reportingPeriodEnd: new Date(input.reportingPeriodEnd),

      reportedValue: input.reportedValue.toString(),

      snapshotMetricTitle: mapping.metricTitle,

      snapshotFramework: mapping.framework,

      evidenceDocumentHash: input.evidenceDocumentHash?.toLowerCase() ?? null,

      status: 'submitted',

    });



    if (!submission) {

      throw new Error('Failed to submit framework metric.');

    }



    await this.approvalsService.createApprovalRecord(

      orgId,

      'framework_metric',

      submission.id,

      userId,

    );



    return submission;

  }



  listAuditLogs(orgId: string, query: unknown) {

    const { page, limit } = paginationSchema.parse(query);

    return this.domainRepository.listAuditLogs(orgId, limit, (page - 1) * limit);

  }

  async createAudit(orgId: string, actorUserId: string, body: unknown, ipAddress?: string | null) {
    const input = createAuditSchema.parse(body);

    if (input.orgId !== orgId) {
      throw new ForbiddenException(
        'Horizontal privilege escalation blocked: organization context mismatch.',
      );
    }

    await this.domainRepository.insertAuditLog({
      organizationId: orgId,
      actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null,
      ipAddress: ipAddress ?? null,
    });

    return { success: true };
  }

}



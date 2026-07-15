import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { WorkflowRepository } from '../../database/repositories/workflow.repository';
import { CreateWorkflowInput, TransitionWorkflowStepInput, AddWorkflowCommentInput } from '@ecosphere/shared';
import { AuthenticatedUser } from '../../common/types/request.types';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly workflowRepo: WorkflowRepository,
  ) {}

  async listWorkflows(orgId: string, user: AuthenticatedUser) {
    // In a real scenario, we might filter workflows based on the user's role and assignments.
    // For now, return all workflows in the organization.
    return this.workflowRepo.listWorkflows(orgId);
  }

  async getWorkflow(orgId: string, id: string) {
    const workflow = await this.workflowRepo.findWorkflowById(orgId, id);
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    return workflow;
  }

  async createWorkflow(orgId: string, user: AuthenticatedUser, input: any) {
    const data = input as CreateWorkflowInput;
    
    // In a real app, steps would be generated from a template
    // Here we hardcode a sample multi-stage workflow
    const steps = [
      {
        stepOrder: 1,
        title: 'Manager Review',
        requiredRole: 'dept_head' as any,
        workflowId: '',
      },
      {
        stepOrder: 2,
        title: 'ESG Officer Verification',
        requiredRole: 'esg_manager' as any,
        workflowId: '',
      },
      {
        stepOrder: 3,
        title: 'Executive Approval',
        requiredRole: 'org_admin' as any,
        workflowId: '',
      }
    ];

    return this.workflowRepo.transaction(async (tx: any) => {
      const { createdWorkflow, createdSteps } = await this.workflowRepo.createWorkflow(
        tx,
        {
          organizationId: orgId,
          title: data.title,
          description: data.description || null,
          ownerId: user.id,
          priority: data.priority as any,
          departmentId: data.departmentId || null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        },
        steps
      );

      await this.workflowRepo.addHistory(tx, {
        workflowId: createdWorkflow.id,
        actorId: user.id,
        action: 'created',
        details: { message: 'Workflow created' },
      });

      return { workflow: createdWorkflow, steps: createdSteps };
    });
  }

  async transitionStep(orgId: string, id: string, stepId: string, user: AuthenticatedUser, input: any) {
    const data = input as TransitionWorkflowStepInput;
    const workflow = await this.getWorkflow(orgId, id);
    const step = workflow.steps.find((s: any) => s.id === stepId);

    if (!step) {
      throw new NotFoundException('Workflow step not found');
    }

    if (step.status !== 'pending') {
      throw new ForbiddenException('Step is already decided');
    }

    // Role verification
    const userRoles = user.roles.filter((r: any) => r.organizationId === orgId).map((r: any) => r.role);
    const isGlobalApprover = userRoles.includes('org_admin') || userRoles.includes('esg_manager');
    if (!isGlobalApprover && (!step.requiredRole || !userRoles.includes(step.requiredRole))) {
      throw new ForbiddenException(`Step requires ${step.requiredRole} role`);
    }

    return this.workflowRepo.transaction(async (tx: any) => {
      await this.workflowRepo.updateStep(tx, step.id, {
        status: data.decision as any,
        decidedById: user.id,
        decisionComment: data.comment || null,
        decidedAt: new Date(),
      });

      await this.workflowRepo.addHistory(tx, {
        workflowId: workflow.id,
        actorId: user.id,
        action: `step_${data.decision}`,
        details: { stepId: step.id, comment: data.comment },
      });

      // Update overall workflow status if needed
      const pendingSteps = workflow.steps.filter((s: any) => s.id !== step.id && s.status === 'pending');
      
      if (data.decision === 'rejected') {
        await this.workflowRepo.updateWorkflowStatus(tx, workflow.id, 'rejected');
      } else if (pendingSteps.length === 0) {
        await this.workflowRepo.updateWorkflowStatus(tx, workflow.id, 'completed');
      } else {
        await this.workflowRepo.updateWorkflowStatus(tx, workflow.id, 'in_review');
      }

      return { success: true };
    });
  }

  async addComment(orgId: string, id: string, user: AuthenticatedUser, input: any) {
    const data = input as AddWorkflowCommentInput;
    const workflow = await this.getWorkflow(orgId, id);

    return this.workflowRepo.transaction(async (tx: any) => {
      const [comment] = await this.workflowRepo.addComment(tx, {
        workflowId: workflow.id,
        authorId: user.id,
        content: data.content,
      });

      await this.workflowRepo.addHistory(tx, {
        workflowId: workflow.id,
        actorId: user.id,
        action: 'comment_added',
        details: { commentId: comment.id },
      });

      return comment;
    });
  }
}

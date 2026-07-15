import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import {
  workflows,
  workflowSteps,
  workflowAssignments,
  workflowComments,
  workflowHistory,
  workflowTemplates,
} from '@ecosphere/db';
import { eq, desc, and } from 'drizzle-orm';

@Injectable()
export class WorkflowRepository extends BaseRepository {
  async findWorkflowById(organizationId: string, workflowId: string) {
    return this.db.query.workflows.findFirst({
      where: and(
        eq(workflows.organizationId, organizationId),
        eq(workflows.id, workflowId)
      ),
      with: {
        steps: {
          orderBy: (steps: any, { asc }: any) => [asc(steps.stepOrder)],
          with: {
            assignments: true,
          }
        },
        comments: {
          orderBy: (comments: any, { desc }: any) => [desc(comments.createdAt)],
          with: {
            author: true,
          }
        },
        owner: true,
        history: {
          orderBy: (history: any, { desc }: any) => [desc(history.createdAt)],
        }
      },
    });
  }

  async listWorkflows(organizationId: string) {
    return this.db.query.workflows.findMany({
      where: eq(workflows.organizationId, organizationId),
      orderBy: (workflows: any, { desc }: any) => [desc(workflows.createdAt)],
      with: {
        owner: true,
        steps: {
          with: {
            assignments: true,
          }
        }
      },
    });
  }

  async createWorkflow(
    tx: any,
    workflow: typeof workflows.$inferInsert,
    steps: typeof workflowSteps.$inferInsert[]
  ) {
    const [createdWorkflow] = await tx
      .insert(workflows)
      .values(workflow)
      .returning();

    const createdSteps = await tx
      .insert(workflowSteps)
      .values(
        steps.map((s: any) => ({
          ...s,
          workflowId: createdWorkflow.id,
        }))
      )
      .returning();

    return { createdWorkflow, createdSteps };
  }

  async addHistory(tx: any, history: typeof workflowHistory.$inferInsert) {
    return tx.insert(workflowHistory).values(history);
  }

  async addComment(tx: any, comment: typeof workflowComments.$inferInsert) {
    return tx.insert(workflowComments).values(comment).returning();
  }

  async updateWorkflowStatus(tx: any, workflowId: string, status: any) {
    return tx
      .update(workflows)
      .set({ status, updatedAt: new Date() })
      .where(eq(workflows.id, workflowId));
  }

  async updateStep(tx: any, stepId: string, data: Partial<typeof workflowSteps.$inferInsert>) {
    return tx
      .update(workflowSteps)
      .set(data)
      .where(eq(workflowSteps.id, stepId));
  }
}

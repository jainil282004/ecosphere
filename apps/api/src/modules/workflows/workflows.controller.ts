import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CurrentUser, SecureOrgRoute, SecureEmployeeRoute } from '../../common/decorators/auth.decorators';
import { AuthenticatedUser } from '../../common/types/request.types';

@Controller('orgs/:orgId/workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  @SecureEmployeeRoute()
  listWorkflows(@Param('orgId') orgId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.workflowsService.listWorkflows(orgId, user);
  }

  @Post()
  @SecureEmployeeRoute()
  createWorkflow(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.workflowsService.createWorkflow(orgId, user, body);
  }

  @Get(':id')
  @SecureEmployeeRoute()
  getWorkflow(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.workflowsService.getWorkflow(orgId, id);
  }

  @Post(':id/steps/:stepId/decision')
  @SecureOrgRoute('approve_submissions')
  transitionStep(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.workflowsService.transitionStep(orgId, id, stepId, user, body);
  }

  @Post(':id/comments')
  @SecureEmployeeRoute()
  addComment(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.workflowsService.addComment(orgId, id, user, body);
  }
}

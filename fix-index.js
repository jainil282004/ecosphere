const fs = require('fs');

const path = 'packages/db/src/schema/index.ts';
let content = fs.readFileSync(path, 'utf8');

// Precisely remove the two enums
const regex = /export const workflowStatusEnum = pgEnum\('workflow_status', \[\s*'draft',\s*'pending',\s*'in_review',\s*'approved',\s*'rejected',\s*'completed',\s*'cancelled',\s*\]\);\s*export const workflowPriorityEnum = pgEnum\('workflow_priority', \[\s*'low',\s*'medium',\s*'high',\s*'urgent',\s*\]\);/m;
content = content.replace(regex, '');

const workflowsCode = `
export const workflowStatusEnum = pgEnum('workflow_status', [
  'draft',
  'pending',
  'in_review',
  'approved',
  'rejected',
  'completed',
  'cancelled',
]);

export const workflowPriorityEnum = pgEnum('workflow_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

export const workflowTemplates = pgTable(
  'workflow_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdById: uuid('created_by_id').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const workflows = pgTable(
  'workflows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id').references(() => workflowTemplates.id),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    status: workflowStatusEnum('status').notNull().default('draft'),
    priority: workflowPriorityEnum('priority').notNull().default('medium'),
    departmentId: uuid('department_id').references(() => departments.id),
    ownerId: uuid('owner_id').notNull().references(() => users.id),
    dueDate: timestamp('due_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('workflows_org_status_idx').on(table.organizationId, table.status),
    index('workflows_owner_idx').on(table.ownerId),
  ]
);

export const workflowSteps = pgTable(
  'workflow_steps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    stepOrder: integer('step_order').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    status: approvalStageStatusEnum('status').notNull().default('pending'),
    requiredRole: roleEnum('required_role'),
    decidedById: uuid('decided_by_id').references(() => users.id),
    decisionComment: text('decision_comment'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    dueDate: timestamp('due_date', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('workflow_steps_order_idx').on(table.workflowId, table.stepOrder),
  ]
);

export const workflowAssignments = pgTable(
  'workflow_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    stepId: uuid('step_id').notNull().references(() => workflowSteps.id, { onDelete: 'cascade' }),
    assignedUserId: uuid('assigned_user_id').references(() => users.id),
    assignedDepartmentId: uuid('assigned_department_id').references(() => departments.id),
    assignedRole: roleEnum('assigned_role'),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const workflowComments = pgTable(
  'workflow_comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').notNull().references(() => users.id),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('workflow_comments_workflow_idx').on(table.workflowId),
  ]
);

export const workflowHistory = pgTable(
  'workflow_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').notNull().references(() => users.id),
    action: varchar('action', { length: 100 }).notNull(),
    details: jsonb('details'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const workflowTemplatesRelations = relations(workflowTemplates, ({ one, many }) => ({
  organization: one(organizations, { fields: [workflowTemplates.organizationId], references: [organizations.id] }),
  createdBy: one(users, { fields: [workflowTemplates.createdById], references: [users.id] }),
  workflows: many(workflows),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  organization: one(organizations, { fields: [workflows.organizationId], references: [organizations.id] }),
  template: one(workflowTemplates, { fields: [workflows.templateId], references: [workflowTemplates.id] }),
  department: one(departments, { fields: [workflows.departmentId], references: [departments.id] }),
  owner: one(users, { fields: [workflows.ownerId], references: [users.id] }),
  steps: many(workflowSteps),
  assignments: many(workflowAssignments),
  comments: many(workflowComments),
  history: many(workflowHistory),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one, many }) => ({
  workflow: one(workflows, { fields: [workflowSteps.workflowId], references: [workflows.id] }),
  decidedBy: one(users, { fields: [workflowSteps.decidedById], references: [users.id] }),
  assignments: many(workflowAssignments),
}));

export const workflowAssignmentsRelations = relations(workflowAssignments, ({ one }) => ({
  workflow: one(workflows, { fields: [workflowAssignments.workflowId], references: [workflows.id] }),
  step: one(workflowSteps, { fields: [workflowAssignments.stepId], references: [workflowSteps.id] }),
  assignedUser: one(users, { fields: [workflowAssignments.assignedUserId], references: [users.id] }),
  assignedDepartment: one(departments, { fields: [workflowAssignments.assignedDepartmentId], references: [departments.id] }),
}));

export const workflowCommentsRelations = relations(workflowComments, ({ one }) => ({
  workflow: one(workflows, { fields: [workflowComments.workflowId], references: [workflows.id] }),
  author: one(users, { fields: [workflowComments.authorId], references: [users.id] }),
}));

export const workflowHistoryRelations = relations(workflowHistory, ({ one }) => ({
  workflow: one(workflows, { fields: [workflowHistory.workflowId], references: [workflows.id] }),
  actor: one(users, { fields: [workflowHistory.actorId], references: [users.id] }),
}));

export * from './vault';
export * from './notifications';
`;

content += "\n" + workflowsCode;
fs.writeFileSync(path, content);

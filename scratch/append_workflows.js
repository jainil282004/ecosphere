const fs = require('fs');

const bottomPath = 'scratch/bottom.ts';
const indexPath = 'packages/db/src/schema/index.ts';

const bottomContent = fs.readFileSync(bottomPath, 'utf8');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Extract Workflows section from bottom.ts
const workflowsStart = bottomContent.indexOf('// -----------------\n// WORKFLOWS');
const extrasStart = bottomContent.indexOf('export const documentTags = pgTable');

if (workflowsStart !== -1 && extrasStart !== -1) {
  const workflowsSection = bottomContent.substring(workflowsStart, extrasStart);
  
  // Replace the wrong name to title in workflow_templates
  // Actually, workflow_templates MUST have 'name' to match 0007!
  let fixedWorkflowsSection = workflowsSection.replace(
    "title: varchar('title', { length: 200 }).notNull(),\n  description:",
    "name: varchar('name', { length: 200 }).notNull(),\n  description:"
  );

  fs.writeFileSync(indexPath, indexContent + '\n' + fixedWorkflowsSection);
  console.log('Appended workflows successfully!');
} else {
  console.log('Could not find workflows section in bottom.ts');
}

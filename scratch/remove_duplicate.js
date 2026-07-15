const fs = require('fs');

const indexPath = 'packages/db/src/schema/index.ts';
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Find the index of the second 'export const notifications = pgTable'
const firstIndex = indexContent.indexOf('export const notifications = pgTable');
const secondIndex = indexContent.indexOf('export const notifications = pgTable', firstIndex + 1);

if (secondIndex !== -1) {
  // Find the end of this block
  const endOfBlock = indexContent.indexOf('});', secondIndex) + 3;
  indexContent = indexContent.substring(0, secondIndex) + indexContent.substring(endOfBlock);
}

fs.writeFileSync(indexPath, indexContent);
console.log('Removed duplicate notifications table');

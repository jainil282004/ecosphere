const fs = require('fs');

const indexPath = 'packages/db/src/schema/index.ts';
const content = fs.readFileSync(indexPath, 'utf8');

// The appended part starts from `export const notificationPriorityEnum`
const splitPoint = content.indexOf('export const notificationPriorityEnum');
const topPart = content.substring(0, splitPoint);
const bottomPart = content.substring(splitPoint);

// Save bottom part
fs.writeFileSync('scratch/bottom.ts', bottomPart);

// Now I will let git restore index.ts, then I will run another script to append bottom.ts
console.log('Saved bottom part');

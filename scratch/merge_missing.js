const fs = require('fs');

const missingPath = 'packages/db/src/schema/missing.ts';
const indexPath = 'packages/db/src/schema/index.ts';

let missingContent = fs.readFileSync(missingPath, 'utf8');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Clean up missing.ts imports
missingContent = missingContent.replace(/import \{.*?\} from '\.\/index';/g, '');
missingContent = missingContent.replace(/import \{.*?\} from 'drizzle-orm\/pg-core';/g, '');
missingContent = missingContent.replace(/import \{.*?\} from 'drizzle-orm';/g, '');

// Clean up export in index
indexContent = indexContent.replace(/export \* from '\.\/missing';/g, '');

fs.writeFileSync(indexPath, indexContent + '\n// --- Missing ---\n' + missingContent);
console.log('Merged missing schemas');

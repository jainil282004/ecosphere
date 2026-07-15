const fs = require('fs');

const vaultPath = 'packages/db/src/schema/vault.ts';
const notifPath = 'packages/db/src/schema/notifications.ts';
const indexPath = 'packages/db/src/schema/index.ts';

const vaultContent = fs.readFileSync(vaultPath, 'utf8');
const notifContent = fs.readFileSync(notifPath, 'utf8');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Remove the export * statements
indexContent = indexContent.replace(/export \* from '\.\/vault';\n/g, '');
indexContent = indexContent.replace(/export \* from '\.\/notifications';\n/g, '');

// Clean up vault.ts imports
const cleanVault = vaultContent.replace(/import \{.*?\} from '\.\/index\.js';/g, '');
// Clean up notifications.ts imports
const cleanNotif = notifContent.replace(/import \{.*?\} from '\.\/index\.js';/g, '');

// Clean up drizzle-orm imports
const finalVault = cleanVault.replace(/import \{.*?\} from 'drizzle-orm\/pg-core';/g, '').replace(/import \{.*?\} from 'drizzle-orm';/g, '');
const finalNotif = cleanNotif.replace(/import \{.*?\} from 'drizzle-orm\/pg-core';/g, '').replace(/import \{.*?\} from 'drizzle-orm';/g, '');

fs.writeFileSync(indexPath, indexContent + '\n// --- Vault ---\n' + finalVault + '\n// --- Notifications ---\n' + finalNotif);

console.log('Merged schema files successfully');

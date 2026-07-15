const fs = require('fs');
const content = fs.readFileSync('packages/db/src/schema/index.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('pgTable(')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});

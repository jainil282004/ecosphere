const fs = require('fs');

const transcriptPath = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\2969f362-b8a3-4df0-92f7-f997dd319a33\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

let vaultContent = '';
let notifContent = '';
let workflowContent = '';

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const entry = JSON.parse(line);
    if (entry.tool_calls) {
      for (const call of entry.tool_calls) {
        if (call.name === 'default_api:write_to_file') {
          const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments;
          if (args.TargetFile && args.TargetFile.includes('vault.ts')) {
            vaultContent = args.CodeContent;
          }
          if (args.TargetFile && args.TargetFile.includes('notifications.ts')) {
            notifContent = args.CodeContent;
          }
          if (args.TargetFile && args.TargetFile.includes('workflow.ts')) {
            workflowContent = args.CodeContent;
          }
          if (args.TargetFile && args.TargetFile.includes('index.ts') && args.TargetFile.includes('schema')) {
            // Check if they rewrote index.ts fully
            if (args.CodeContent && args.CodeContent.includes('export const workflows')) {
               console.log('Found full index.ts rewrite!');
               fs.writeFileSync('scratch/recovered_index.ts', args.CodeContent);
            }
          }
        }
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
}

if (vaultContent) fs.writeFileSync('scratch/recovered_vault.ts', vaultContent);
if (notifContent) fs.writeFileSync('scratch/recovered_notif.ts', notifContent);
if (workflowContent) fs.writeFileSync('scratch/recovered_workflow.ts', workflowContent);

console.log('Recovery script finished');

const fs = require('fs');

const transcriptPath = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\2969f362-b8a3-4df0-92f7-f997dd319a33\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

let allCode = '';

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const entry = JSON.parse(line);
    if (entry.tool_calls) {
      for (const call of entry.tool_calls) {
        let args = call.arguments;
        if (typeof args === 'string') {
           args = JSON.parse(args);
        }
        if (args.CodeContent) {
           allCode += '\n// --- CodeContent ---\n' + args.CodeContent;
        }
        if (args.ReplacementContent) {
           allCode += '\n// --- ReplacementContent ---\n' + args.ReplacementContent;
        }
        if (args.ReplacementChunks) {
           for (const chunk of args.ReplacementChunks) {
              if (chunk.ReplacementContent) {
                 allCode += '\n// --- Chunk ReplacementContent ---\n' + chunk.ReplacementContent;
              }
           }
        }
      }
    }
  } catch (e) {
  }
}

fs.writeFileSync('scratch/all_code_dump.txt', allCode);
console.log('Dumped all code to scratch/all_code_dump.txt');

const { spawn } = require('child_process');

const proc = spawn('pnpm', ['drizzle-kit', 'generate'], {
  cwd: 'c:\\Users\\HP\\Desktop\\Hackthon - 2026\\packages\\db',
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

proc.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  if (output.includes('Is')) {
    proc.stdin.write('\r\n');
  }
});

proc.stderr.on('data', (data) => console.error(data.toString()));
proc.on('close', (code) => console.log(`Exit code ${code}`));

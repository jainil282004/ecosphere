#!/usr/bin/env node
/**
 * EcoSphere infrastructure automation — single-command environment lifecycle.
 *
 * Usage:
 *   node scripts/ecosphere.mjs development up
 *   node scripts/ecosphere.mjs staging up
 *   node scripts/ecosphere.mjs production up
 *   node scripts/ecosphere.mjs development down
 *   node scripts/ecosphere.mjs development setup
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const environment = process.argv[2] ?? 'development';
const action = process.argv[3] ?? 'up';

const composeFiles = {
  development: [
    'docker-compose.infra.yml',
    'docker/compose/docker-compose.development.yml',
  ],
  staging: ['docker-compose.infra.yml', 'docker/compose/docker-compose.staging.yml'],
  production: ['docker-compose.yml'],
};

const envFiles = {
  development: '.env.development.example',
  staging: '.env.staging.example',
  production: '.env.production.example',
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function composeArgs(extraArgs) {
  const files = composeFiles[environment];
  if (!files) {
    console.error(`Unknown environment "${environment}". Use development | staging | production.`);
    process.exit(1);
  }
  const args = ['compose'];
  for (const file of files) {
    args.push('-f', file);
  }
  args.push(...extraArgs);
  return args;
}

function ensureEnvFile() {
  const target = join(ROOT, '.env');
  const sourceName = envFiles[environment];
  const source = join(ROOT, sourceName);
  if (!existsSync(target) && existsSync(source)) {
    copyFileSync(source, target);
    console.log(`[ecosphere] Created .env from ${sourceName}`);
  }
  
  // Load variables into process.env for child processes synchronously
  if (existsSync(target)) {
    const content = readFileSync(target, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          process.env[match[1].trim()] = match[2].trim();
        }
      }
    }
  }
}

function setupLocal() {
  ensureEnvFile();
  run('pnpm', ['install']);
  run('pnpm', ['--filter', '@ecosphere/shared', 'build']);
  run('pnpm', ['--filter', '@ecosphere/db', 'build']);
  run('pnpm', ['--filter', '@ecosphere/db-typeorm', 'build']);
  run('pnpm', ['--filter', '@ecosphere/db', 'wait']);
  run('pnpm', ['db:migrate']);
  run('pnpm', ['db:typeorm:migrate']);
  if (environment === 'development') {
    run('pnpm', ['db:seed']);
  }
}

function upDevelopment() {
  ensureEnvFile();
  run('docker', composeArgs(['up', '-d', 'postgres', 'redis']));
  setupLocal();
  console.log('[ecosphere] Development infrastructure ready. Starting API + Web...');
  run('pnpm', ['dev']);
}

function upContainerized() {
  ensureEnvFile();
  run('docker', composeArgs(['up', '-d', '--build']));
  console.log(`[ecosphere] ${environment} stack is running behind nginx.`);
}

function downStack() {
  run('docker', composeArgs(['down']));
}

function main() {
  switch (action) {
    case 'setup':
      ensureEnvFile();
      run('docker', composeArgs(['up', '-d', 'postgres', 'redis']));
      setupLocal();
      break;
    case 'up':
      if (environment === 'development') {
        upDevelopment();
      } else {
        upContainerized();
      }
      break;
    case 'down':
      downStack();
      break;
    case 'infra':
      ensureEnvFile();
      run('docker', composeArgs(['up', '-d', 'postgres', 'redis']));
      break;
    case 'full':
      ensureEnvFile();
      run('docker', composeArgs(['--profile', 'full-stack', 'up', '-d', '--build']));
      break;
    default:
      console.error(`Unknown action "${action}". Use up | down | setup | infra | full.`);
      process.exit(1);
  }
}

main();

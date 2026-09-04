import { access, copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(__dirname, '..');
const dataset = resolve(root, 'data/raw/300-user-linkedin.csv');
const envFile = resolve(root, '.env');
const envExample = resolve(root, '.env.example');
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

async function main(): Promise<void> {
  if (Number(process.versions.node.split('.')[0]) !== 22) {
    throw new Error('Node.js 22 is required for setup');
  }
  run('docker', ['compose', 'version']);
  run('docker', ['info']);
  await ensureEnvironmentFile();
  await requireFile(dataset, 'Required dataset is missing');

  run('docker', ['compose', 'up', '-d', '--wait', 'postgres', 'elasticsearch']);
  run(pnpmCommand, ['db:generate']);
  run(pnpmCommand, ['db:migrate:deploy']);
  run(pnpmCommand, ['data:import']);
  run(pnpmCommand, ['search:reindex']);
  run(pnpmCommand, ['search:index:status']);
}

async function ensureEnvironmentFile(): Promise<void> {
  try {
    await access(envFile, constants.R_OK);
  } catch {
    await requireFile(envExample, '.env.example is missing');
    await copyFile(envExample, envFile);
    console.log(
      'Created .env from .env.example. Review local credentials before continuing.',
    );
  }
}

async function requireFile(path: string, message: string): Promise<void> {
  try {
    await access(path, constants.R_OK);
  } catch {
    throw new Error(`${message}: ${path}`);
  }
}

function run(command: string, args: string[]): void {
  console.log(`> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed with status ${result.status}`,
    );
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Setup failed');
  process.exitCode = 1;
});

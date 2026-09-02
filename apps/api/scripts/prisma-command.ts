import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

const repositoryEnvironmentPath = resolve(__dirname, '../../../.env');

try {
  loadEnvFile(repositoryEnvironmentPath);
} catch (error: unknown) {
  if (!isMissingFileError(error)) {
    throw error;
  }
}

const prismaArguments = process.argv
  .slice(2)
  .filter((argument) => argument !== '--');
if (prismaArguments[0] === 'generate' && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://generate:generate@localhost:5432/generate?schema=public';
}

const child = spawn('prisma', prismaArguments, {
  cwd: resolve(__dirname, '..'),
  env: process.env,
  stdio: 'inherit',
});

child.on('error', () => {
  console.error('Unable to start the Prisma CLI');
  process.exitCode = 1;
});

child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

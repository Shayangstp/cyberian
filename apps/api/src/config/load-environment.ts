import { loadEnvFile } from 'node:process';
import { rootEnvironmentFilePath } from './environment-file';
import { environmentValidationSchema } from './environment.validation';

export function loadValidatedEnvironment(): void {
  try {
    loadEnvFile(rootEnvironmentFilePath);
  } catch (error: unknown) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }

  const result = environmentValidationSchema.validate({
    NODE_ENV: process.env.NODE_ENV,
    API_PORT: process.env.API_PORT,
    WEB_ORIGIN: process.env.WEB_ORIGIN,
    DATABASE_URL: process.env.DATABASE_URL,
  });
  if (result.error) {
    throw new Error(
      'Environment validation failed for the data import command',
    );
  }

  const values = result.value as Record<string, string | number>;
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = String(value);
  }
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

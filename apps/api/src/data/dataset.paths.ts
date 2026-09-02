import { resolve } from 'node:path';

export const repositoryRoot = resolve(__dirname, '../../../..');

export const defaultDatasetPath = resolve(
  repositoryRoot,
  'data/raw/300-user-linkedin.csv',
);

export const defaultImportReportPath = resolve(
  repositoryRoot,
  'data/processed/import-report.json',
);

export function resolveDatasetPath(explicitPath?: string): string {
  return explicitPath
    ? resolve(repositoryRoot, explicitPath)
    : defaultDatasetPath;
}

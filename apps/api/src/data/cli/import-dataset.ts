import { PrismaClient } from '@prisma/client';
import { loadValidatedEnvironment } from '../../config/load-environment';
import { importDataset } from '../data-importer';
import { writeImportReport } from '../import-report';
import { defaultImportReportPath, resolveDatasetPath } from '../dataset.paths';
import { createPrismaProfileWriter } from '../prisma-profile-writer';

async function main(): Promise<void> {
  const arguments_ = process.argv
    .slice(2)
    .filter((argument) => argument !== '--');
  const dryRun = arguments_.includes('--dry-run');
  const explicitPath = arguments_.find(
    (argument) => !argument.startsWith('--'),
  );
  const datasetPath = resolveDatasetPath(explicitPath);
  const prisma = dryRun ? null : createPrismaClient();

  try {
    const report = await importDataset(datasetPath, {
      dryRun,
      writeBatch: prisma ? createPrismaProfileWriter(prisma) : undefined,
    });
    await writeImportReport(defaultImportReportPath, report);
    console.log(JSON.stringify(report.summary, null, 2));
  } finally {
    await prisma?.$disconnect();
  }
}

function createPrismaClient(): PrismaClient {
  loadValidatedEnvironment();
  return new PrismaClient();
}

void main().catch((error: unknown) => {
  console.error(safeImportError(error));
  process.exitCode = 1;
});

function safeImportError(error: unknown): string {
  if (
    error instanceof Error &&
    error.message.startsWith('Environment validation failed')
  ) {
    return 'Dataset import failed: DATABASE_URL is missing or invalid';
  }
  if (
    error instanceof Error &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  ) {
    return 'Dataset import failed: the dataset file was not found';
  }
  return 'Dataset import failed during a database batch; profile values are intentionally omitted';
}

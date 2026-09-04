import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { loadValidatedEnvironment } from '../../config/load-environment';
import { importDataset } from '../data-importer';
import { resolveDatasetPath } from '../dataset.paths';
import type { NormalizedProfile } from '../dataset.types';
import { auditPassed, auditProfileDataset } from '../profile-data-audit';
import { toPrismaData } from '../prisma-profile-writer';

async function main(): Promise<void> {
  loadValidatedEnvironment();
  const datasetPath = resolveDatasetPath();
  assertLocalProjectDatabase(process.env.DATABASE_URL, datasetPath);
  const audit = await auditProfileDataset(datasetPath);
  if (!auditPassed(audit)) throw new Error('audit_failed');

  const profiles: NormalizedProfile[] = [];
  await importDataset(datasetPath, {
    writeBatch: (batch) => {
      profiles.push(...batch);
      return Promise.resolve({
        created: batch.length,
        updated: 0,
        unchanged: 0,
      });
    },
  });

  const prisma = new PrismaClient();
  try {
    const database = await prisma.$queryRaw<
      Array<{ database: string }>
    >`SELECT current_database() AS database`;
    if (database[0]?.database !== 'cyberian')
      throw new Error('database_identity_failed');
    const previous = await prisma.profile.count();
    await prisma.$transaction(async (transaction) => {
      await transaction.profile.deleteMany();
      const importedAt = new Date();
      for (const profile of profiles) {
        await transaction.profile.create({
          data: toPrismaData(profile, importedAt),
        });
      }
    });
    console.log(
      JSON.stringify(
        { previousProfiles: previous, rebuiltProfiles: profiles.length },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

function assertLocalProjectDatabase(
  databaseUrl: string | undefined,
  datasetPath: string,
): void {
  if (!databaseUrl || !existsSync(datasetPath))
    throw new Error('local_prerequisite_failed');
  const url = new URL(databaseUrl);
  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.pathname !== '/cyberian'
  ) {
    throw new Error('database_not_local_project');
  }
  const services = execFileSync(
    'docker',
    ['compose', 'ps', '--status', 'running', '--services'],
    {
      encoding: 'utf8',
    },
  );
  if (!services.split(/\s+/).includes('postgres'))
    throw new Error('project_postgres_not_running');
}

void main().catch(() => {
  console.error(
    'Profile rebuild stopped by a local-safety or data-quality check',
  );
  process.exitCode = 1;
});

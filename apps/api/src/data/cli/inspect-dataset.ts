import { inspectDataset } from '../dataset-reader';
import { resolveDatasetPath } from '../dataset.paths';

async function main(): Promise<void> {
  const explicitPath = process.argv
    .slice(2)
    .find((argument) => argument !== '--');
  const inspection = await inspectDataset(resolveDatasetPath(explicitPath));
  console.log(JSON.stringify(inspection, null, 2));
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown inspection error';
  console.error(`Dataset inspection failed: ${message}`);
  process.exitCode = 1;
});

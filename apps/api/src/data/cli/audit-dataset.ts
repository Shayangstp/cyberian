import { resolveDatasetPath } from '../dataset.paths';
import { auditPassed, auditProfileDataset } from '../profile-data-audit';

async function main(): Promise<void> {
  const filePath = resolveDatasetPath(
    process.argv.slice(2).find((value) => value !== '--'),
  );
  const audit = await auditProfileDataset(filePath);
  console.log(JSON.stringify(audit, null, 2));
  if (!auditPassed(audit)) process.exitCode = 1;
}

void main().catch(() => {
  console.error(
    'Dataset audit failed; source values are intentionally omitted',
  );
  process.exitCode = 1;
});

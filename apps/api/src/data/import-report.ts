import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ImportReport } from './dataset.types';

export async function writeImportReport(
  reportPath: string,
  report: ImportReport,
): Promise<void> {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

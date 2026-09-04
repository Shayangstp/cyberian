import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectDataset } from '../src/data/dataset-reader';

describe('inspectDataset', () => {
  it('detects headers, quoted fields, structured values, and malformed widths', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'cyberian-reader-'));
    const fixturePath = join(directory, 'synthetic.csv');
    await writeFile(
      fixturePath,
      [
        'profile_id,job_title,skills,experience',
        'synthetic-1,"Engineer, Platform","[""TypeScript"",""SQL""]","[{""title"":""Engineer""}]"',
        'synthetic-2,Designer',
      ].join('\n'),
      'utf8',
    );

    try {
      const inspection = await inspectDataset(fixturePath);

      expect(inspection.headers).toEqual([
        'profile_id',
        'job_title',
        'skills',
        'experience',
      ]);
      expect(inspection.columnCount).toBe(4);
      expect(inspection.recordCount).toBe(2);
      expect(inspection.validCount).toBe(1);
      expect(inspection.malformedCount).toBe(1);
      expect(inspection.malformedRowNumbers).toEqual([2]);
      expect(inspection.rowWidthDistribution).toEqual({ '2': 1, '4': 1 });

      const diagnostics = JSON.stringify(inspection);
      expect(diagnostics).not.toContain('Engineer, Platform');
      expect(diagnostics).not.toContain('synthetic-1');
    } finally {
      await rm(directory, { recursive: true });
    }
  });
});

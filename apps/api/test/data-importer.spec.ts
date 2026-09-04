import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importDataset } from '../src/data/data-importer';
import type {
  NormalizedProfile,
  ProfileBatchWriter,
} from '../src/data/dataset.types';
import { LINKEDIN_PROFILE_SOURCE_HEADERS } from '../src/data/linkedin-profile-source-layout';

describe('importDataset', () => {
  it('performs no writes during dry-run and reports only aggregates', async () => {
    await withFixture(async (fixturePath) => {
      const writeBatch = jest.fn<
        ReturnType<ProfileBatchWriter>,
        Parameters<ProfileBatchWriter>
      >();

      const report = await importDataset(fixturePath, {
        dryRun: true,
        writeBatch,
      });

      expect(writeBatch).not.toHaveBeenCalled();
      expect(report.summary).toMatchObject({
        totalRecords: 4,
        validRecords: 3,
        created: 0,
        updated: 0,
        unchanged: 0,
        skipped: 2,
        malformed: 1,
      });
      expect(report.malformedRowNumbers).toEqual([4]);
      expect(JSON.stringify(report)).not.toContain('Synthetic Person');
    });
  });

  it('imports valid records, skips malformed and duplicate rows, and is idempotent', async () => {
    await withFixture(async (fixturePath) => {
      const stored = new Map<string, string>();
      const writeBatch: ProfileBatchWriter = (profiles) => {
        let created = 0;
        let unchanged = 0;
        let updated = 0;
        for (const profile of profiles) {
          const serialized = serializeProfile(profile);
          const existing = stored.get(profile.sourceKey);
          if (existing === undefined) {
            stored.set(profile.sourceKey, serialized);
            created += 1;
          } else if (existing === serialized) {
            unchanged += 1;
          } else {
            stored.set(profile.sourceKey, serialized);
            updated += 1;
          }
        }
        return Promise.resolve({ created, updated, unchanged });
      };

      const first = await importDataset(fixturePath, { writeBatch });
      const second = await importDataset(fixturePath, { writeBatch });

      expect(first.summary).toMatchObject({
        created: 2,
        updated: 0,
        unchanged: 0,
        skipped: 2,
        malformed: 1,
      });
      expect(second.summary).toMatchObject({
        created: 0,
        updated: 0,
        unchanged: 2,
        skipped: 2,
        malformed: 1,
      });
      expect(stored.size).toBe(2);
    });
  });
});

async function withFixture(
  assertion: (fixturePath: string) => Promise<void>,
): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'cyberian-importer-'));
  const fixturePath = join(directory, 'synthetic.csv');
  await writeFile(
    fixturePath,
    [
      LINKEDIN_PROFILE_SOURCE_HEADERS.join(','),
      csvRow(
        sourceRow('synthetic-1', 'Synthetic Person', 'Engineer', [
          'TypeScript',
          'SQL',
        ]),
      ),
      csvRow(
        sourceRow('synthetic-2', 'Another Synthetic Person', 'Designer', [
          'Design',
        ]),
      ),
      csvRow(
        sourceRow('synthetic-1', 'Synthetic Person', 'Engineer', [
          'TypeScript',
        ]),
      ),
      'malformed,record',
    ].join('\n'),
    'utf8',
  );

  try {
    await assertion(fixturePath);
  } finally {
    await rm(directory, { recursive: true });
  }
}

function sourceRow(
  id: string,
  name: string,
  title: string,
  skills: string[],
): string[] {
  const row = Object.fromEntries(
    LINKEDIN_PROFILE_SOURCE_HEADERS.map((key) => [key, '']),
  );
  for (const key of LINKEDIN_PROFILE_SOURCE_HEADERS.slice(45, 58))
    row[key] = '[]';
  row.version_status = '{}';
  row.linkedin_id = id;
  row.full_name = name;
  row.job_title = title;
  row.skills = JSON.stringify(skills);
  return LINKEDIN_PROFILE_SOURCE_HEADERS.map((key) => row[key] ?? '');
}

function csvRow(values: string[]): string {
  return values.map((value) => `"${value.replaceAll('"', '""')}"`).join(',');
}

function serializeProfile(profile: NormalizedProfile): string {
  return JSON.stringify(profile);
}

import { basename } from 'node:path';
import { inspectDataset } from './dataset-reader';
import type {
  ImportReport,
  ImportSummary,
  NormalizedProfile,
  ProfileBatchWriter,
} from './dataset.types';
import { ProfileNormalizer } from './profile-normalizer';
import { adaptLinkedinProfileSource } from './linkedin-profile-source-layout';

export interface ImportDatasetOptions {
  dryRun?: boolean;
  batchSize?: number;
  writeBatch?: ProfileBatchWriter;
  now?: () => Date;
}

export async function importDataset(
  filePath: string,
  options: ImportDatasetOptions = {},
): Promise<ImportReport> {
  const startedAt = Date.now();
  const dryRun = options.dryRun ?? false;
  const batchSize = options.batchSize ?? 50;
  const now = options.now ?? (() => new Date());
  const normalizer = new ProfileNormalizer();
  const pending: NormalizedProfile[] = [];
  const sourceKeys = new Set<string>();
  const rejectionReasonCounts: Record<string, number> = {};
  const summary: ImportSummary = {
    totalRecords: 0,
    validRecords: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    malformed: 0,
    normalizationWarnings: 0,
    durationMs: 0,
  };

  if (!dryRun && !options.writeBatch) {
    throw new Error('A profile batch writer is required for a real import');
  }

  const flush = async (): Promise<void> => {
    if (pending.length === 0) {
      return;
    }
    const batch = pending.splice(0, pending.length);
    if (dryRun) {
      return;
    }
    const result = await options.writeBatch?.(batch);
    if (!result) {
      throw new Error('Profile batch writer did not return a result');
    }
    summary.created += result.created;
    summary.updated += result.updated;
    summary.unchanged += result.unchanged;
  };

  const inspection = await inspectDataset(filePath, async (record) => {
    const adapted = adaptLinkedinProfileSource(record);
    if (!adapted.record) {
      summary.skipped += 1;
      incrementReason(
        rejectionReasonCounts,
        adapted.rejectionCode ?? 'unsupported_source_layout',
      );
      return;
    }
    const result = normalizer.normalize(adapted.record);
    summary.normalizationWarnings += result.warningCodes.length;

    if (!result.profile) {
      summary.skipped += 1;
      incrementReason(
        rejectionReasonCounts,
        result.rejectionCode ?? 'normalization_rejected',
      );
      return;
    }

    summary.validRecords += 1;
    if (sourceKeys.has(result.profile.sourceKey)) {
      summary.skipped += 1;
      incrementReason(rejectionReasonCounts, 'duplicate_source_key');
      return;
    }

    sourceKeys.add(result.profile.sourceKey);
    pending.push(result.profile);
    if (pending.length >= batchSize) {
      await flush();
    }
  });

  await flush();
  summary.totalRecords = inspection.recordCount;
  summary.malformed = inspection.malformedCount;
  summary.skipped += inspection.malformedCount;
  if (inspection.malformedCount > 0) {
    rejectionReasonCounts.malformed_row_width = inspection.malformedCount;
  }
  summary.durationMs = Date.now() - startedAt;

  return {
    timestamp: now().toISOString(),
    sourceFilename: basename(filePath),
    dryRun,
    summary,
    malformedRowNumbers: inspection.malformedRowNumbers,
    rejectionReasonCounts,
  };
}

function incrementReason(counts: Record<string, number>, reason: string): void {
  counts[reason] = (counts[reason] ?? 0) + 1;
}

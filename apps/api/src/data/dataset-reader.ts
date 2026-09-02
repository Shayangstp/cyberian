import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import { parse } from 'csv-parse';
import type {
  ColumnCompleteness,
  DatasetInspection,
  DatasetRecord,
} from './dataset.types';

export type DatasetRecordHandler = (
  record: DatasetRecord,
  recordNumber: number,
) => Promise<void> | void;

export async function inspectDataset(
  filePath: string,
  onValidRecord?: DatasetRecordHandler,
): Promise<DatasetInspection> {
  const parser = createReadStream(filePath, { encoding: 'utf8' }).pipe(
    parse({
      bom: true,
      relax_column_count: true,
      relax_quotes: true,
      skip_empty_lines: true,
    }),
  ) as AsyncIterable<unknown>;

  let headers: string[] | null = null;
  let recordCount = 0;
  let validCount = 0;
  const malformedRowNumbers: number[] = [];
  const rowWidths = new Map<number, number>();
  let completeness: ColumnCompleteness[] = [];

  for await (const parsedRow of parser) {
    if (!isStringArray(parsedRow)) {
      throw new Error('CSV parser returned an unsupported record shape');
    }

    if (!headers) {
      headers = parsedRow.map((header) => header.trim());
      completeness = headers.map((header) => ({
        header,
        empty: 0,
        nonEmpty: 0,
      }));
      continue;
    }

    recordCount += 1;
    rowWidths.set(parsedRow.length, (rowWidths.get(parsedRow.length) ?? 0) + 1);

    if (parsedRow.length !== headers.length) {
      malformedRowNumbers.push(recordCount);
      continue;
    }

    validCount += 1;
    const record: Record<string, string> = {};
    for (const [index, header] of headers.entries()) {
      const value = parsedRow[index] ?? '';
      record[header] = value;
      const counts = completeness[index];
      if (counts) {
        if (value.trim() === '') {
          counts.empty += 1;
        } else {
          counts.nonEmpty += 1;
        }
      }
    }

    await onValidRecord?.(record, recordCount);
  }

  if (!headers) {
    throw new Error('Dataset does not contain a CSV header');
  }

  return {
    sourceFilename: basename(filePath),
    headers,
    columnCount: headers.length,
    recordCount,
    rowWidthDistribution: Object.fromEntries(
      [...rowWidths.entries()]
        .sort(([left], [right]) => left - right)
        .map(([width, count]) => [String(width), count]),
    ),
    validCount,
    malformedCount: malformedRowNumbers.length,
    malformedRowNumbers,
    columnCompleteness: completeness,
  };
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

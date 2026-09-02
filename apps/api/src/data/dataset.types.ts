export type DatasetRecord = Readonly<Record<string, string>>;

export interface ColumnCompleteness {
  header: string;
  empty: number;
  nonEmpty: number;
}

export interface DatasetInspection {
  sourceFilename: string;
  headers: string[];
  columnCount: number;
  recordCount: number;
  rowWidthDistribution: Record<string, number>;
  validCount: number;
  malformedCount: number;
  malformedRowNumbers: number[];
  columnCompleteness: ColumnCompleteness[];
}

export type SafeJsonObject = Record<string, string>;

export interface NormalizedProfile {
  sourceKey: string;
  linkedinId: string | null;
  linkedinUrl: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  industry: string | null;
  jobTitle: string | null;
  jobTitleRole: string | null;
  currentCompanyName: string | null;
  locationName: string | null;
  country: string | null;
  summary: string | null;
  inferredYearsExperience: number | null;
  skills: string[];
  experience: SafeJsonObject[] | null;
  education: SafeJsonObject[] | null;
  sourceUpdatedAt: Date | null;
}

export interface NormalizationResult {
  profile: NormalizedProfile | null;
  warningCodes: string[];
  rejectionCode?: string;
}

export interface ImportSummary {
  totalRecords: number;
  validRecords: number;
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
  malformed: number;
  normalizationWarnings: number;
  durationMs: number;
}

export interface ImportReport {
  timestamp: string;
  sourceFilename: string;
  dryRun: boolean;
  summary: ImportSummary;
  malformedRowNumbers: number[];
  rejectionReasonCounts: Record<string, number>;
}

export interface BatchWriteResult {
  created: number;
  updated: number;
  unchanged: number;
}

export type ProfileBatchWriter = (
  profiles: readonly NormalizedProfile[],
) => Promise<BatchWriteResult>;

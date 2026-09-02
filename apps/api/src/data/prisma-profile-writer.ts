import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  BatchWriteResult,
  NormalizedProfile,
  ProfileBatchWriter,
} from './dataset.types';

export function createPrismaProfileWriter(
  prisma: PrismaClient,
): ProfileBatchWriter {
  return async (profiles): Promise<BatchWriteResult> => {
    const existingProfiles = await prisma.profile.findMany({
      where: { sourceKey: { in: profiles.map(({ sourceKey }) => sourceKey) } },
    });
    const existingBySourceKey = new Map(
      existingProfiles.map((profile) => [profile.sourceKey, profile]),
    );
    const operations: Prisma.PrismaPromise<unknown>[] = [];
    const result: BatchWriteResult = { created: 0, updated: 0, unchanged: 0 };
    const importedAt = new Date();

    for (const profile of profiles) {
      const existing = existingBySourceKey.get(profile.sourceKey);
      if (!existing) {
        operations.push(
          prisma.profile.create({
            data: toPrismaData(profile, importedAt),
          }),
        );
        result.created += 1;
        continue;
      }

      if (profilesMatch(existing, profile)) {
        result.unchanged += 1;
        continue;
      }

      operations.push(
        prisma.profile.update({
          where: { sourceKey: profile.sourceKey },
          data: toPrismaData(profile, importedAt),
        }),
      );
      result.updated += 1;
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }
    return result;
  };
}

function toPrismaData(profile: NormalizedProfile, importedAt: Date) {
  return {
    sourceKey: profile.sourceKey,
    linkedinId: profile.linkedinId,
    linkedinUrl: profile.linkedinUrl,
    fullName: profile.fullName,
    firstName: profile.firstName,
    lastName: profile.lastName,
    industry: profile.industry,
    jobTitle: profile.jobTitle,
    jobTitleRole: profile.jobTitleRole,
    currentCompanyName: profile.currentCompanyName,
    locationName: profile.locationName,
    country: profile.country,
    summary: profile.summary,
    inferredYearsExperience: profile.inferredYearsExperience,
    skills: profile.skills,
    experience:
      profile.experience === null
        ? Prisma.DbNull
        : (profile.experience as Prisma.InputJsonValue),
    education:
      profile.education === null
        ? Prisma.DbNull
        : (profile.education as Prisma.InputJsonValue),
    sourceUpdatedAt: profile.sourceUpdatedAt,
    importedAt,
  };
}

function profilesMatch(
  existing: {
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
    experience: Prisma.JsonValue;
    education: Prisma.JsonValue;
    sourceUpdatedAt: Date | null;
  },
  incoming: NormalizedProfile,
): boolean {
  return (
    existing.linkedinId === incoming.linkedinId &&
    existing.linkedinUrl === incoming.linkedinUrl &&
    existing.fullName === incoming.fullName &&
    existing.firstName === incoming.firstName &&
    existing.lastName === incoming.lastName &&
    existing.industry === incoming.industry &&
    existing.jobTitle === incoming.jobTitle &&
    existing.jobTitleRole === incoming.jobTitleRole &&
    existing.currentCompanyName === incoming.currentCompanyName &&
    existing.locationName === incoming.locationName &&
    existing.country === incoming.country &&
    existing.summary === incoming.summary &&
    existing.inferredYearsExperience === incoming.inferredYearsExperience &&
    JSON.stringify(existing.skills) === JSON.stringify(incoming.skills) &&
    jsonValuesMatch(existing.experience, incoming.experience) &&
    jsonValuesMatch(existing.education, incoming.education) &&
    existing.sourceUpdatedAt?.toISOString() ===
      incoming.sourceUpdatedAt?.toISOString()
  );
}

function jsonValuesMatch(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => jsonValuesMatch(value, right[index]))
    );
  }
  if (!isJsonObject(left) || !isJsonObject(right)) {
    return false;
  }

  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] && jsonValuesMatch(left[key], right[key]),
    )
  );
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

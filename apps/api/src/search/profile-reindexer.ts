import type { Client } from '@elastic/elasticsearch';
import type { PrismaClient, Profile } from '@prisma/client';
import {
  assertSearchDocumentSafe,
  mapProfileToSearchDocument,
} from './profile-document.mapper';
import type { ProfileIndexManager } from './profile-index-manager';
import type { ProfileSearchDocument } from './profile-search-document';
export class ProfileReindexer {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly client: Client,
    private readonly manager: ProfileIndexManager,
    private readonly batchSize = 100,
  ) {}
  async reindex() {
    const index = await this.manager.createIndex();
    let after: string | undefined;
    let indexed = 0;
    try {
      for (;;) {
        const rows = await this.prisma.profile.findMany({
          take: this.batchSize,
          ...(after ? { skip: 1, cursor: { id: after } } : {}),
          orderBy: { id: 'asc' },
        });
        if (!rows.length) break;
        await this.bulk(index, rows);
        indexed += rows.length;
        after = rows.at(-1)?.id;
      }
      await this.client.indices.refresh({ index });
      const expected = await this.prisma.profile.count();
      const actual = await this.manager.count(index);
      if (actual !== expected)
        throw new Error(
          `Indexed count mismatch: expected ${expected}, got ${actual}`,
        );
      await this.verifyIndexQuality(index, expected);
      const previousIndex = await this.manager.switchAlias(index);
      return { index, previousIndex, indexed, expected, actual };
    } catch {
      throw new Error(
        `Reindex failed before alias switch; new index ${index} was left untouched for inspection`,
      );
    }
  }
  private async verifyIndexQuality(index: string, expected: number) {
    if (expected > 1000)
      throw new Error('Index quality check exceeds safe result window');
    const result = await this.client.search<ProfileSearchDocument>({
      index,
      size: expected,
      query: { match_all: {} },
      sort: [{ id: 'asc' }],
    });
    if (result.hits.hits.length !== expected)
      throw new Error('Index quality count mismatch');
    for (const hit of result.hits.hits) {
      if (!hit._source) throw new Error('Index quality document missing');
      assertSearchDocumentSafe(hit._source);
    }
  }
  private async bulk(index: string, rows: Profile[]) {
    const operations = rows.flatMap((profile) => [
      { index: { _index: index, _id: profile.id } },
      mapProfileToSearchDocument(profile),
    ]);
    const result = await this.client.bulk({ operations, refresh: false });
    if (result.errors) {
      const failures = result.items.filter(
        (item) => Object.values(item)[0]?.error,
      ).length;
      throw new Error(`Bulk indexing failed for ${failures} documents`);
    }
  }
}

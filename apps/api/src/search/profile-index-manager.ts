import type { Client } from '@elastic/elasticsearch';
import {
  PROFILE_INDEX_VERSION,
  profileIndexMapping,
} from './profile-index.mapping';
export class ProfileIndexManager {
  constructor(
    private readonly client: Client,
    private readonly alias: string,
  ) {}
  async activeIndex(): Promise<string | null> {
    try {
      const result = await this.client.indices.getAlias({ name: this.alias });
      return Object.keys(result)[0] ?? null;
    } catch (error: unknown) {
      if (
        (error as { meta?: { statusCode?: number } }).meta?.statusCode === 404
      )
        return null;
      throw error;
    }
  }
  async createIndex(): Promise<string> {
    const name = `${this.alias}-v${PROFILE_INDEX_VERSION}-${Date.now()}`;
    await this.client.indices.create({ index: name, ...profileIndexMapping });
    return name;
  }
  async switchAlias(index: string): Promise<string | null> {
    const old = await this.activeIndex();
    const actions = [
      ...(old ? [{ remove: { index: old, alias: this.alias } }] : []),
      { add: { index, alias: this.alias } },
    ];
    await this.client.indices.updateAliases({ actions });
    return old;
  }
  async count(index: string): Promise<number> {
    return (await this.client.count({ index })).count;
  }
  async status() {
    const active = await this.activeIndex();
    return {
      activeIndex: active,
      elasticsearchCount: active ? await this.count(active) : 0,
      version: PROFILE_INDEX_VERSION,
    };
  }
}

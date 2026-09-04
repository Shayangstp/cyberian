import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Client } from '@elastic/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { ELASTICSEARCH_CLIENT } from '../../search/search.module';
import type { ProfileSearchDocument } from '../../search/profile-search-document';
import { mapPublicProfile } from './profile-search-result.mapper';
import { buildSearchQuery } from './search-query.builder';
import type { SearchProfilesQuery } from './dto/search-profiles.query';
@Injectable()
export class ProfilesSearchService {
  constructor(
    @Inject(ELASTICSEARCH_CLIENT) private readonly client: Client,
    private readonly config: ConfigService,
  ) {}
  async search(query: SearchProfilesQuery) {
    try {
      const response = await this.client.search<ProfileSearchDocument>(
        buildSearchQuery(
          this.config.getOrThrow<string>('app.elasticsearchIndexAlias'),
          query,
        ),
      );
      const total =
        typeof response.hits.total === 'number'
          ? response.hits.total
          : (response.hits.total?.value ?? 0);
      return {
        data: response.hits.hits.map((hit) =>
          mapPublicProfile(hit._source as ProfileSearchDocument, hit.highlight),
        ),
        meta: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
          tookMs: response.took,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'BadRequestException')
        throw error;
      throw new ServiceUnavailableException(
        'Profile search is temporarily unavailable',
      );
    }
  }
}

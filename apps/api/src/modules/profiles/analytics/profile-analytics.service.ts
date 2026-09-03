import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Client } from '@elastic/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { ELASTICSEARCH_CLIENT } from '../../../search/search.module';
import { mapProfileAnalytics } from './profile-analytics.mapper';

const CARDINALITY_PRECISION_THRESHOLD = 1000;
const TOP_BUCKET_LIMIT = 10;
const TERMS_ORDER = { _count: 'desc' as const };

@Injectable()
export class ProfileAnalyticsService {
  constructor(
    @Inject(ELASTICSEARCH_CLIENT) private readonly client: Client,
    private readonly config: ConfigService,
  ) {}

  async getAnalytics() {
    try {
      const response = await this.client.search({
        index: this.config.getOrThrow<string>('app.elasticsearchIndexAlias'),
        size: 0,
        track_total_hits: true,
        aggs: {
          uniqueIndustries: cardinality('industry.keyword'),
          uniqueSkills: cardinality('skills.keyword'),
          uniqueCountries: cardinality('country.keyword'),
          topIndustries: terms('industry.keyword'),
          topSkills: terms('skills.keyword'),
          countries: terms('country.keyword'),
        },
      });
      return mapProfileAnalytics(response);
    } catch {
      throw new ServiceUnavailableException(
        'Profile analytics are temporarily unavailable',
      );
    }
  }
}

function cardinality(field: string) {
  return {
    cardinality: {
      field,
      precision_threshold: CARDINALITY_PRECISION_THRESHOLD,
    },
  };
}

function terms(field: string) {
  return { terms: { field, size: TOP_BUCKET_LIMIT, order: TERMS_ORDER } };
}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createElasticsearchClient } from './elasticsearch.client';
export const ELASTICSEARCH_CLIENT = Symbol('ELASTICSEARCH_CLIENT');
@Module({
  providers: [
    {
      provide: ELASTICSEARCH_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createElasticsearchClient(
          config.getOrThrow<string>('app.elasticsearchUrl'),
        ),
    },
  ],
  exports: [ELASTICSEARCH_CLIENT],
})
export class SearchModule {}

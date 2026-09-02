import type { ConfigType } from '@nestjs/config';
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.API_PORT ?? 3000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL as string,
  elasticsearchUrl: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
  elasticsearchIndexAlias: process.env.ELASTICSEARCH_INDEX_ALIAS ?? 'profiles',
}));

export type AppConfig = ConfigType<typeof appConfig>;

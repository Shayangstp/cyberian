import type { ConfigType } from '@nestjs/config';
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.API_PORT ?? 3000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  webOrigins: (process.env.WEB_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseUrl: process.env.DATABASE_URL as string,
  elasticsearchUrl: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
  elasticsearchIndexAlias: process.env.ELASTICSEARCH_INDEX_ALIAS ?? 'profiles',
  requestSizeLimit: process.env.REQUEST_SIZE_LIMIT ?? '100kb',
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 100),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
}));

export type AppConfig = ConfigType<typeof appConfig>;

import type { ConfigType } from '@nestjs/config';
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.API_PORT ?? 3000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
}));

export type AppConfig = ConfigType<typeof appConfig>;

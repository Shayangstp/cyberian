import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { AppConfig } from './config/environment';
import { configureHttpApp } from './bootstrap/configure-http-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService).getOrThrow<AppConfig>('app');
  configureHttpApp(app, { enableShutdownHooks: true, enableSwagger: true });

  await app.listen(config.port);
}

void bootstrap();

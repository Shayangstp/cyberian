import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import type { AppConfig } from '../config/environment';

type ConfigureHttpAppOptions = {
  enableSwagger?: boolean;
  enableShutdownHooks?: boolean;
};

/** Applies the production HTTP boundary to both runtime and in-memory apps. */
export function configureHttpApp(
  app: INestApplication,
  options: ConfigureHttpAppOptions = {},
): void {
  const config = app.get(ConfigService).getOrThrow<AppConfig>('app');

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(json({ limit: config.requestSizeLimit }));
  app.use(urlencoded({ extended: true, limit: config.requestSizeLimit }));
  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) {
      return callback(null, !origin || config.webOrigins.includes(origin));
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (options.enableShutdownHooks) app.enableShutdownHooks();
  if (options.enableSwagger) {
    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder().setTitle('Cyberian API').setVersion('1').build(),
      ),
    );
  }
}

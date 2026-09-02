import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { rootEnvironmentFilePath } from './config/environment-file';
import { appConfig } from './config/environment';
import { environmentValidationSchema } from './config/environment.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { ProfilesModule } from './modules/profiles/profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: rootEnvironmentFilePath,
      load: [appConfig],
      validationSchema: environmentValidationSchema,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.getOrThrow<number>('app.rateLimitWindowMs'),
          limit: config.getOrThrow<number>('app.rateLimitMax'),
        },
      ],
    }),
    DatabaseModule,
    HealthModule,
    ProfilesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

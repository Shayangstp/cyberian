import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    DatabaseModule,
    HealthModule,
    ProfilesModule,
  ],
})
export class AppModule {}

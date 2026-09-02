import { Module } from '@nestjs/common';
import { SearchModule } from '../../search/search.module';
import { ProfileAnalyticsService } from './analytics/profile-analytics.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesSearchService } from './profiles-search.service';
@Module({
  imports: [SearchModule],
  controllers: [ProfilesController],
  providers: [ProfilesSearchService, ProfileAnalyticsService],
})
export class ProfilesModule {}

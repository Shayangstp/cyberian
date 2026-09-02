import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfileAnalyticsService } from './analytics/profile-analytics.service';
import { SearchProfilesQuery } from './dto/search-profiles.query';
import { ProfilesSearchService } from './profiles-search.service';
@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly search: ProfilesSearchService,
    private readonly analytics: ProfileAnalyticsService,
  ) {}
  @Get('search')
  @ApiOperation({ summary: 'Search normalized professional profiles' })
  searchProfiles(@Query() query: SearchProfilesQuery) {
    return this.search.search(query);
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get aggregate profile dataset analytics',
    description:
      'Returns aggregate totals and up to ten buckets per category. No profile documents are returned.',
  })
  @ApiResponse({ status: 200, description: 'Profile dataset analytics.' })
  @ApiResponse({
    status: 503,
    description: 'Profile analytics are temporarily unavailable.',
  })
  getAnalytics() {
    return this.analytics.getAnalytics();
  }
}

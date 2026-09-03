import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Search normalized professional profiles',
    description:
      'Searches approved professional fields only. Skill filters use AND semantics.',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    example: 'engineer',
    description: 'Keyword matched against approved professional fields.',
  })
  @ApiQuery({
    name: 'skills',
    required: false,
    type: String,
    example: 'TypeScript,SQL',
    description:
      'Comma-separated skills. A profile must match every supplied skill.',
  })
  @ApiQuery({
    name: 'jobTitle',
    required: false,
    type: String,
    example: 'Software Engineer',
    description: 'Job title matched with partial, case-insensitive terms.',
  })
  @ApiQuery({
    name: 'industry',
    required: false,
    type: String,
    example: 'Technology',
    description: 'Industry matched with partial, case-insensitive terms.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    minimum: 1,
    default: 1,
    description: 'One-based result page.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 10,
    default: 10,
    description: 'Results per page (maximum 10).',
  })
  @ApiResponse({
    status: 200,
    description: 'Matching profiles and pagination metadata.',
  })
  @ApiResponse({ status: 400, description: 'Invalid search parameters.' })
  @ApiResponse({
    status: 503,
    description: 'Profile search is temporarily unavailable.',
  })
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

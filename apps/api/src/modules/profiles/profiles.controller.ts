import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchProfilesQuery } from './dto/search-profiles.query';
import { ProfilesSearchService } from './profiles-search.service';
@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly search: ProfilesSearchService) {}
  @Get('search')
  @ApiOperation({ summary: 'Search normalized professional profiles' })
  searchProfiles(@Query() query: SearchProfilesQuery) {
    return this.search.search(query);
  }
}

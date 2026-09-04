import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@cyberian/shared';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}

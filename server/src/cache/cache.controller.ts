import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { CacheService } from './cache.service';
@Controller('cache')
export class CacheController {
  constructor(private cacheService: CacheService) {}

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    return this.cacheService.getStats();
  }
}

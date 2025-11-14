import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';

@Global()
@Module({
  providers: [
    {
      provide: CacheService,
      useFactory: () => {
        return new CacheService({
          stdTTL: 3600, // 1 hour default
          checkperiod: 120, // Check every 2 minutes
          useClones: true,
        });
      },
    },
  ],
  exports: [CacheService],
  controllers: [CacheController],
})
export class CacheModule {}

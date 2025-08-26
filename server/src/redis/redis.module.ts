import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient } from 'redis';
const redisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: async () => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = createClient({
      url: redisUrl,
    });

    client.on('error', (err) => {
      console.log('Redis Client Error', err);
    });

    await client.connect();
    return client;
  },
};

@Module({
  exports: [RedisService, redisProvider],
  providers: [RedisService, redisProvider],
})
export class RedisModule {}

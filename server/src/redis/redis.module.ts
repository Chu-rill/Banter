import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient } from 'redis';
import { RoomRedisService } from './room.redis';
import { UserRedisService } from './user.redis';
const redisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: async () => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = createClient({
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!),
      },
      // url: redisUrl,
    });

    client.on('error', (err) => {
      console.log('Redis Client Error', err);
    });

    await client.connect();
    return client;
  },
};

@Module({
  exports: [RedisService, redisProvider, RoomRedisService, UserRedisService],
  providers: [RedisService, redisProvider, RoomRedisService, UserRedisService],
})
export class RedisModule {}

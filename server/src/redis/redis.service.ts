import { Injectable, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
  ) {}

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.setEx(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return await this.redisClient.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.redisClient.exists(key);
  }

  // Additional methods for WebSocket functionality
  async mget(keys: string[]): Promise<(string | null)[]> {
    return await this.redisClient.mGet(keys);
  }

  async mset(keyValuePairs: Record<string, string>): Promise<void> {
    await this.redisClient.mSet(keyValuePairs);
  }

  async incr(key: string): Promise<number> {
    return await this.redisClient.incr(key);
  }

  async expire(key: string, seconds: number): Promise<any> {
    return await this.redisClient.expire(key, seconds);
  }

  // Hash operations (useful for user presence)
  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.redisClient.hSet(key, field, value);
  }

  async hget(key: string, field: string): Promise<any> {
    return await this.redisClient.hGet(key, field);
  }

  async hdel(key: string, fields: string[]): Promise<number> {
    return await this.redisClient.hDel(key, fields);
  }

  // Set operations (useful for active users, rooms)
  async sadd(key: string, members: string[]): Promise<number> {
    return await this.redisClient.sAdd(key, members);
  }

  async srem(key: string, members: string[]): Promise<number> {
    return await this.redisClient.sRem(key, members);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.redisClient.sMembers(key);
  }

  async sismember(key: string, member: string): Promise<any> {
    return await this.redisClient.sIsMember(key, member);
  }

  // List operations (useful for message queues)
  async lpush(key: string, elements: string[]): Promise<number> {
    return await this.redisClient.lPush(key, elements);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.redisClient.rPop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.redisClient.lRange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return await this.redisClient.lLen(key);
  }
}

import { Injectable, Logger } from '@nestjs/common';
const NodeCache = require('node-cache');

export interface CacheConfig {
  stdTTL?: number;
  checkperiod?: number;
  useClones?: boolean;
}

@Injectable()
export class CacheService {
  private cache: any;
  private readonly logger = new Logger(CacheService.name);

  constructor(config: CacheConfig = {}) {
    this.cache = new NodeCache({
      stdTTL: config.stdTTL || 3600, // Default 1 hour
      checkperiod: config.checkperiod || 120, // Check for expired keys every 2 minutes
      useClones: config.useClones !== undefined ? config.useClones : true,
    });

    // Log cache statistics periodically
    this.cache.on('expired', (key, value) => {
      this.logger.debug(`Cache key expired: ${key}`);
    });

    this.cache.on('flush', () => {
      this.logger.log('Cache flushed');
    });
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | undefined {
    const value = this.cache.get(key) as T | undefined;
    if (value !== undefined) {
      this.logger.debug(`Cache hit: ${key}`);
    } else {
      this.logger.debug(`Cache miss: ${key}`);
    }
    return value;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    const success = this.cache.set(key, value, ttl || 0);
    if (success) {
      this.logger.debug(`Cache set: ${key} (TTL: ${ttl || 'default'}s)`);
    }
    return success;
  }

  /**
   * Delete a key from cache
   */
  del(key: string | string[]): number {
    const deleted = this.cache.del(key);
    this.logger.debug(`Cache deleted: ${Array.isArray(key) ? key.join(', ') : key} (${deleted} keys)`);
    return deleted;
  }

  /**
   * Delete all keys matching a pattern
   */
  delPattern(pattern: string): number {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    if (matchingKeys.length > 0) {
      return this.del(matchingKeys);
    }
    return 0;
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get or set pattern - get from cache or fetch and cache
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Flush all cache
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return this.cache.keys();
  }

  /**
   * Get TTL for a key
   */
  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  /**
   * Update TTL for a key
   */
  ttl(key: string, ttl: number): boolean {
    return this.cache.ttl(key, ttl);
  }
}

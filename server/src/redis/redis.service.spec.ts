import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { RedisClientType } from 'redis';

describe('RedisService', () => {
  let service: RedisService;
  let redisClient: jest.Mocked<RedisClientType>;

  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    mGet: jest.fn(),
    mSet: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    hSet: jest.fn(),
    hGet: jest.fn(),
    hDel: jest.fn(),
    sAdd: jest.fn(),
    sRem: jest.fn(),
    sMembers: jest.fn(),
    sIsMember: jest.fn(),
    lPush: jest.fn(),
    rPop: jest.fn(),
    lRange: jest.fn(),
    lLen: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    redisClient = module.get('REDIS_CLIENT');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Basic Operations', () => {
    describe('get', () => {
      it('should get value from Redis', async () => {
        redisClient.get.mockResolvedValue('value');

        const result = await service.get('key');

        expect(redisClient.get).toHaveBeenCalledWith('key');
        expect(result).toBe('value');
      });

      it('should return null when key does not exist', async () => {
        redisClient.get.mockResolvedValue(null);

        const result = await service.get('nonexistent');

        expect(redisClient.get).toHaveBeenCalledWith('nonexistent');
        expect(result).toBeNull();
      });
    });

    describe('set', () => {
      it('should set value without TTL', async () => {
        redisClient.set.mockResolvedValue('OK');

        await service.set('key', 'value');

        expect(redisClient.set).toHaveBeenCalledWith('key', 'value');
        expect(redisClient.setEx).not.toHaveBeenCalled();
      });

      it('should set value with TTL', async () => {
        redisClient.setEx.mockResolvedValue('OK');

        await service.set('key', 'value', 3600);

        expect(redisClient.setEx).toHaveBeenCalledWith('key', 3600, 'value');
        expect(redisClient.set).not.toHaveBeenCalled();
      });
    });

    describe('del', () => {
      it('should delete key and return count', async () => {
        redisClient.del.mockResolvedValue(1);

        const result = await service.del('key');

        expect(redisClient.del).toHaveBeenCalledWith('key');
        expect(result).toBe(1);
      });

      it('should return 0 when key does not exist', async () => {
        redisClient.del.mockResolvedValue(0);

        const result = await service.del('nonexistent');

        expect(redisClient.del).toHaveBeenCalledWith('nonexistent');
        expect(result).toBe(0);
      });
    });

    describe('exists', () => {
      it('should return 1 when key exists', async () => {
        redisClient.exists.mockResolvedValue(1);

        const result = await service.exists('key');

        expect(redisClient.exists).toHaveBeenCalledWith('key');
        expect(result).toBe(1);
      });

      it('should return 0 when key does not exist', async () => {
        redisClient.exists.mockResolvedValue(0);

        const result = await service.exists('nonexistent');

        expect(redisClient.exists).toHaveBeenCalledWith('nonexistent');
        expect(result).toBe(0);
      });
    });
  });

  describe('Multi Operations', () => {
    describe('mget', () => {
      it('should get multiple values', async () => {
        redisClient.mGet.mockResolvedValue(['value1', 'value2', null]);

        const result = await service.mget(['key1', 'key2', 'key3']);

        expect(redisClient.mGet).toHaveBeenCalledWith(['key1', 'key2', 'key3']);
        expect(result).toEqual(['value1', 'value2', null]);
      });
    });

    describe('mset', () => {
      it('should set multiple key-value pairs', async () => {
        redisClient.mSet.mockResolvedValue('OK');

        await service.mset({ key1: 'value1', key2: 'value2' });

        expect(redisClient.mSet).toHaveBeenCalledWith({ key1: 'value1', key2: 'value2' });
      });
    });

    describe('incr', () => {
      it('should increment counter', async () => {
        redisClient.incr.mockResolvedValue(5);

        const result = await service.incr('counter');

        expect(redisClient.incr).toHaveBeenCalledWith('counter');
        expect(result).toBe(5);
      });
    });

    describe('expire', () => {
      it('should set expiration time', async () => {
        redisClient.expire.mockResolvedValue(1);

        const result = await service.expire('key', 3600);

        expect(redisClient.expire).toHaveBeenCalledWith('key', 3600);
        expect(result).toBe(1);
      });
    });
  });

  describe('Hash Operations', () => {
    describe('hset', () => {
      it('should set hash field', async () => {
        redisClient.hSet.mockResolvedValue(1);

        const result = await service.hset('hash', 'field', 'value');

        expect(redisClient.hSet).toHaveBeenCalledWith('hash', 'field', 'value');
        expect(result).toBe(1);
      });
    });

    describe('hget', () => {
      it('should get hash field value', async () => {
        redisClient.hGet.mockResolvedValue('value');

        const result = await service.hget('hash', 'field');

        expect(redisClient.hGet).toHaveBeenCalledWith('hash', 'field');
        expect(result).toBe('value');
      });
    });

    describe('hdel', () => {
      it('should delete hash fields', async () => {
        redisClient.hDel.mockResolvedValue(2);

        const result = await service.hdel('hash', ['field1', 'field2']);

        expect(redisClient.hDel).toHaveBeenCalledWith('hash', ['field1', 'field2']);
        expect(result).toBe(2);
      });
    });
  });

  describe('Set Operations', () => {
    describe('sadd', () => {
      it('should add members to set', async () => {
        redisClient.sAdd.mockResolvedValue(2);

        const result = await service.sadd('set', ['member1', 'member2']);

        expect(redisClient.sAdd).toHaveBeenCalledWith('set', ['member1', 'member2']);
        expect(result).toBe(2);
      });
    });

    describe('srem', () => {
      it('should remove members from set', async () => {
        redisClient.sRem.mockResolvedValue(1);

        const result = await service.srem('set', ['member1']);

        expect(redisClient.sRem).toHaveBeenCalledWith('set', ['member1']);
        expect(result).toBe(1);
      });
    });

    describe('smembers', () => {
      it('should get all set members', async () => {
        redisClient.sMembers.mockResolvedValue(['member1', 'member2']);

        const result = await service.smembers('set');

        expect(redisClient.sMembers).toHaveBeenCalledWith('set');
        expect(result).toEqual(['member1', 'member2']);
      });
    });

    describe('sismember', () => {
      it('should check if member exists in set', async () => {
        redisClient.sIsMember.mockResolvedValue(true);

        const result = await service.sismember('set', 'member1');

        expect(redisClient.sIsMember).toHaveBeenCalledWith('set', 'member1');
        expect(result).toBe(true);
      });
    });
  });

  describe('List Operations', () => {
    describe('lpush', () => {
      it('should push elements to list head', async () => {
        redisClient.lPush.mockResolvedValue(3);

        const result = await service.lpush('list', ['item1', 'item2']);

        expect(redisClient.lPush).toHaveBeenCalledWith('list', ['item1', 'item2']);
        expect(result).toBe(3);
      });
    });

    describe('rpop', () => {
      it('should pop element from list tail', async () => {
        redisClient.rPop.mockResolvedValue('item');

        const result = await service.rpop('list');

        expect(redisClient.rPop).toHaveBeenCalledWith('list');
        expect(result).toBe('item');
      });

      it('should return null when list is empty', async () => {
        redisClient.rPop.mockResolvedValue(null);

        const result = await service.rpop('emptylist');

        expect(redisClient.rPop).toHaveBeenCalledWith('emptylist');
        expect(result).toBeNull();
      });
    });

    describe('lrange', () => {
      it('should get list elements in range', async () => {
        redisClient.lRange.mockResolvedValue(['item1', 'item2', 'item3']);

        const result = await service.lrange('list', 0, 2);

        expect(redisClient.lRange).toHaveBeenCalledWith('list', 0, 2);
        expect(result).toEqual(['item1', 'item2', 'item3']);
      });
    });

    describe('llen', () => {
      it('should get list length', async () => {
        redisClient.lLen.mockResolvedValue(5);

        const result = await service.llen('list');

        expect(redisClient.lLen).toHaveBeenCalledWith('list');
        expect(result).toBe(5);
      });
    });
  });
});

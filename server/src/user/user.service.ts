import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './validation';
import { UserRepository } from './user.repository';
import { SupabaseService } from 'src/file/file.service';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class UserService {
  private readonly USER_CACHE_TTL = 3600; // 1 hour
  private readonly USER_CACHE_PREFIX = 'user:';

  constructor(
    private userRepository: UserRepository,
    private readonly supabaseService: SupabaseService,
    private readonly cacheService: CacheService,
  ) {}

  async getUserById(id: string) {
    const cacheKey = `${this.USER_CACHE_PREFIX}id:${id}`;

    // Try to get from cache
    const user = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const userData = await this.userRepository.getUserById(id);
        if (!userData) {
          throw new NotFoundException('User not found');
        }
        return userData;
      },
      this.USER_CACHE_TTL,
    );

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  async getUserByEmail(email: string) {
    const cacheKey = `${this.USER_CACHE_PREFIX}email:${email}`;

    // Try to get from cache
    const user = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const userData = await this.userRepository.getUserByEmail(email);
        if (!userData) {
          throw new NotFoundException('User not found');
        }
        return userData;
      },
      this.USER_CACHE_TTL,
    );

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  async getUserByUsername(username: string) {
    const cacheKey = `${this.USER_CACHE_PREFIX}username:${username}`;

    // Try to get from cache
    const user = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const userData = await this.userRepository.getUserByUsername(username);
        if (!userData) {
          throw new NotFoundException('User not found');
        }
        return userData;
      },
      this.USER_CACHE_TTL,
    );

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  async searchUsersByUsername(username: string) {
    const users = await this.userRepository.searchUsersByUsername(username);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    };
  }

  async updateUser(id: string, updateData: UpdateUserDto) {
    try {
      const user = await this.userRepository.updateUser(id, updateData);

      // Invalidate all caches for this user
      this.invalidateUserCache(user.id, user.email, user.username);

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Profile updated successfully',
        data: user,
      };
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    // Step 1: upload file to Supabase
    const fileUrl = await this.supabaseService.uploadAvatar(file, 'uploads');
    const avatarUrl = fileUrl;

    // Step 2: update user record in DB
    const user = await this.userRepository.updateAvatar(userId, avatarUrl);

    // Invalidate all caches for this user
    this.invalidateUserCache(user.id, user.email, user.username);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Avatar updated successfully',
      data: user,
    };
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    // Ensure safe defaults
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const { users, total } = await this.userRepository.getAllUsers(
      pageNum,
      limitNum,
    );

    const totalPages = Math.ceil(total / limit);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };
  }

  async updateOnlineStatus(id: string, isOnline: boolean) {
    const user = await this.userRepository.updateUser(id, { isOnline });

    // Invalidate all caches for this user
    if (user) {
      this.invalidateUserCache(user.id, user.email, user.username);
    }

    return user;
  }

  /**
   * Helper method to invalidate all cache entries for a user
   */
  private invalidateUserCache(id: string, email: string, username: string): void {
    const keysToDelete = [
      `${this.USER_CACHE_PREFIX}id:${id}`,
      `${this.USER_CACHE_PREFIX}email:${email}`,
      `${this.USER_CACHE_PREFIX}username:${username}`,
    ];
    this.cacheService.del(keysToDelete);
  }
}

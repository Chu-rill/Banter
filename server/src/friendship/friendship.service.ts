import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { FriendshipRepository } from './friendship.repository';
import { FriendStatus } from '../../generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from 'src/user/user.repository';
import { AppGateway } from 'src/gateway/app.gateway';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class FriendshipService {
  private readonly logger = new Logger(FriendshipService.name);
  private readonly FRIENDSHIP_CACHE_TTL = 1800; // 30 minutes
  private readonly FRIENDSHIP_CACHE_PREFIX = 'friendship:';

  constructor(
    private readonly friendshipRepository: FriendshipRepository,
    private prisma: PrismaService,
    private userRepository: UserRepository,
    private gateway: AppGateway,
    private readonly cacheService: CacheService,
  ) {}

  async addFriend(requesterId: string, receiverId: string) {
    let existing = await this.friendshipRepository.existing(
      requesterId,
      receiverId,
    );
    if (existing) {
      throw new BadRequestException('Friendship already exists');
    }

    const [friend, user] = await Promise.all([
      this.friendshipRepository.sendFriendRequest(requesterId, receiverId),
      this.userRepository.getUserById(requesterId),
    ]);

    const notification = await this.prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'FRIEND_REQUEST',
        message: `You have a new friend request from ${user.username}`,
        metadata: {
          requesterId,
          requesterName: user.username,
          requesterAvatar: user.avatar,
        },
      },
    });

    this.gateway.server
      // .to(receiverId)
      .emit('notification:friend', notification);

    // Invalidate friendship cache for both users
    this.invalidateFriendshipCache(requesterId);
    this.invalidateFriendshipCache(receiverId);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Friend request sent successfully',
      data: friend,
    };
  }

  async updateFriendshipStatus(
    friendshipId: string,
    userId: string,
    status: FriendStatus,
  ) {
    try {
      const value = await this.friendshipRepository.respondToRequest(
        friendshipId,
        status,
      );
      const friendship = await this.friendshipRepository.getById(friendshipId);

      if (!friendship) {
        throw new BadRequestException('Friendship not found');
      }

      const { requesterId, receiverId } = friendship;

      const user = await this.userRepository.getUserById(userId);

      const notifyUserId = userId === requesterId ? receiverId : requesterId;

      // Map friend status -> notification & message
      const statusMap = {
        [FriendStatus.ACCEPTED]: {
          type: 'FRIEND_ACCEPTED',
          message: `You accepted the request from ${user.username}`,
          successMsg: 'Friend request accepted successfully',
        },
        [FriendStatus.DECLINED]: {
          type: 'FRIEND_DECLINED',
          message: `You declined the request from ${user.username}`,
          successMsg: 'Friend request declined successfully',
        },
        [FriendStatus.BLOCKED]: {
          type: 'FRIEND_BLOCKED',
          message: `You blocked ${user.username}`,
          successMsg: 'Friend blocked successfully',
        },
      };

      const config = statusMap[status];

      const notification = await this.prisma.notification.create({
        data: {
          userId: notifyUserId,
          type: config.type,
          message: config.message,
          metadata: {
            requesterId,
            requesterName: user.username,
            requesterAvatar: user.avatar,
          },
        },
      });

      this.gateway.server
        // .to(receiverId)
        .emit('notification:friend', notification);

      // Invalidate friendship cache for both users
      this.invalidateFriendshipCache(requesterId);
      this.invalidateFriendshipCache(receiverId);

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: config.successMsg,
        data: friendship,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update friendship (${status}): ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to update friendship');
    }
  }

  async listFriends(userId: string) {
    const cacheKey = `${this.FRIENDSHIP_CACHE_PREFIX}${userId}:accepted`;

    // Try to get from cache
    const friends = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const friendships = await this.friendshipRepository.getFriendshipsByStatus(
          userId,
          FriendStatus.ACCEPTED,
        );

        return friendships.map((f) => {
          const otherUser = f.requesterId === userId ? f.receiver : f.requester;
          return {
            friendshipId: f.id,
            status: f.status,
            friend: otherUser,
            senderId: f.requesterId,
            receiverId: f.receiverId,
          };
        });
      },
      this.FRIENDSHIP_CACHE_TTL,
    );

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'List of friends retrieved successfully',
      data: friends,
    };
  }
  async listRequests(userId: string) {
    const cacheKey = `${this.FRIENDSHIP_CACHE_PREFIX}${userId}:pending`;

    // Try to get from cache
    const list = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return await this.friendshipRepository.getFriendshipsByStatus(
          userId,
          FriendStatus.PENDING,
        );
      },
      this.FRIENDSHIP_CACHE_TTL,
    );

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'List of friend requests retrieved successfully',
      data: list,
    };
  }

  async listBlocked(userId: string) {
    const cacheKey = `${this.FRIENDSHIP_CACHE_PREFIX}${userId}:blocked`;

    // Try to get from cache
    const list = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return await this.friendshipRepository.getFriendshipsByStatus(
          userId,
          FriendStatus.BLOCKED,
        );
      },
      this.FRIENDSHIP_CACHE_TTL,
    );

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'List of blocked friend retrieved successfully',
      data: list,
    };
  }

  async canSendMessage(senderId: string, receiverId: string): Promise<boolean> {
    return this.friendshipRepository.areFriends(senderId, receiverId);
  }

  /**
   * Helper method to invalidate all friendship caches for a user
   */
  private invalidateFriendshipCache(userId: string): void {
    const keysToDelete = [
      `${this.FRIENDSHIP_CACHE_PREFIX}${userId}:accepted`,
      `${this.FRIENDSHIP_CACHE_PREFIX}${userId}:pending`,
      `${this.FRIENDSHIP_CACHE_PREFIX}${userId}:blocked`,
    ];
    this.cacheService.del(keysToDelete);
  }
}

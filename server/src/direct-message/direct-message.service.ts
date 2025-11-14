import { Injectable } from '@nestjs/common';
import { DirectMessageRepository } from './direct-message-repository';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class DirectMessageService {
  private readonly DM_CACHE_TTL = 300; // 5 minutes
  private readonly DM_CACHE_PREFIX = 'messages:dm:';

  constructor(
    private readonly repo: DirectMessageRepository,
    private readonly cacheService: CacheService,
  ) {}

  async sendDirectMessage(
    senderId: string,
    receiverId: string,
    content?: string,
    type?,
    mediaUrl?,
    mediaType?,
  ) {
    // business logic: check if they are friends before sending
    // (optional: inject FriendshipService to validate friendship)
    const message = await this.repo.sendMessage(
      senderId,
      receiverId,
      content,
      type,
      mediaType,
      mediaUrl,
    );

    // Invalidate DM cache for this conversation
    this.invalidateDMCache(senderId, receiverId);

    return message;
  }

  async getChat(userId: string, friendId: string, limit = 50) {
    // Create a consistent cache key (sort IDs to ensure same key for both users)
    const cacheKey = this.getDMCacheKey(userId, friendId, limit);

    return await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return await this.repo.getConversation(userId, friendId, limit);
      },
      this.DM_CACHE_TTL,
    );
  }

  /**
   * Helper method to create consistent cache key for DM conversation
   */
  private getDMCacheKey(userId1: string, userId2: string, limit: number): string {
    // Sort IDs to ensure same key regardless of who queries
    const [id1, id2] = [userId1, userId2].sort();
    return `${this.DM_CACHE_PREFIX}${id1}:${id2}:${limit}`;
  }

  /**
   * Helper method to invalidate DM cache for a conversation
   */
  private invalidateDMCache(userId1: string, userId2: string): void {
    const [id1, id2] = [userId1, userId2].sort();
    this.cacheService.delPattern(`${this.DM_CACHE_PREFIX}${id1}:${id2}:`);
  }
}

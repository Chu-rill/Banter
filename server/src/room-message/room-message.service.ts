import { Injectable } from '@nestjs/common';
import { MessageType, MediaType } from '../../generated/prisma';
import { RoomMessageRepository } from './room-message.repository';
import { time } from 'console';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class RoomMessageService {
  private readonly MESSAGE_CACHE_TTL = 300; // 5 minutes
  private readonly MESSAGE_CACHE_PREFIX = 'messages:room:';

  constructor(
    private readonly roomMessageRepository: RoomMessageRepository,
    private readonly cacheService: CacheService,
  ) {}

  async sendMessage(
    roomId: string,
    userId: string,
    content?: string,
    type?,
    mediaUrl?,
    mediaType?,
  ) {
    // Business rules example: prevent empty messages unless media
    if (!content && !mediaUrl) {
      throw new Error('Message must have content or media');
    }

    const message = await this.roomMessageRepository.createMessage(
      roomId,
      userId,
      content,
      type,
      mediaUrl,
      mediaType,
    );

    // Invalidate room messages cache
    this.invalidateRoomMessagesCache(roomId);

    return message;
  }

  async getRoomMessages(
    roomId: string,
    userId: string,
    limit = 50,
    cursor?: string,
  ) {
    // Only cache the first page (no cursor) for simplicity
    if (!cursor) {
      const cacheKey = `${this.MESSAGE_CACHE_PREFIX}${roomId}:${limit}`;
      return await this.cacheService.getOrSet(
        cacheKey,
        async () => {
          return await this.roomMessageRepository.getMessages(
            roomId,
            userId,
            limit,
            cursor,
          );
        },
        this.MESSAGE_CACHE_TTL,
      );
    }

    // For paginated requests (with cursor), fetch directly
    return await this.roomMessageRepository.getMessages(
      roomId,
      userId,
      limit,
      cursor,
    );
  }

  async sendSystemMessage(roomId: string, content: string, userId: string) {
    let data = await this.roomMessageRepository.createMessage(
      roomId,
      userId,
      content,
      MessageType.SYSTEM,
    );

    // Invalidate room messages cache
    this.invalidateRoomMessagesCache(roomId);

    return {
      id: data.id,
      room: data.roomId,
      user: data.user.username,
      content: data.content,
      timestamp: data.createdAt,
      type: data.type,
    };
  }

  async markMessagesRead(
    roomId: string,
    userId: string,
    lastMessageId: string,
  ) {
    const data = await this.roomMessageRepository.markMessagesAsRead(
      roomId,
      userId,
      lastMessageId,
    );
    return data;
  }

  /**
   * Helper method to invalidate all message caches for a room
   */
  private invalidateRoomMessagesCache(roomId: string): void {
    // Delete all cache keys for this room (handles different limits)
    this.cacheService.delPattern(`${this.MESSAGE_CACHE_PREFIX}${roomId}:`);
  }
}

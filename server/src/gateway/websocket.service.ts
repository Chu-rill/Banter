import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);

  constructor(private readonly redisService: RedisService) {}

  // Store user-socket mapping
  async setUserSocket(userId: string, socketId: string): Promise<void> {
    try {
      // Store user -> socket mapping with 1 hour TTL
      await this.redisService.set(`ws:user:${userId}`, socketId, 3600);

      // Store reverse mapping for cleanup
      await this.redisService.set(`ws:socket:${socketId}`, userId, 3600);

      this.logger.log(`User ${userId} mapped to socket ${socketId}`);
    } catch (error) {
      this.logger.error(`Error setting user socket mapping:`, error);
    }
  }

  // Get socket ID for a user
  async getUserSocket(userId: string): Promise<string | null> {
    try {
      return await this.redisService.get(`ws:user:${userId}`);
    } catch (error) {
      this.logger.error(`Error getting socket for user ${userId}:`, error);
      return null;
    }
  }

  // Remove user-socket mapping
  async removeUserSocket(userId: string, socketId: string): Promise<void> {
    try {
      await this.redisService.del(`ws:user:${userId}`);
      await this.redisService.del(`ws:socket:${socketId}`);

      this.logger.log(`Removed mapping for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error removing user socket mapping:`, error);
    }
  }

  // Get user by socket ID
  async getUserBySocket(socketId: string): Promise<string | null> {
    try {
      return await this.redisService.get(`ws:socket:${socketId}`);
    } catch (error) {
      this.logger.error(`Error getting user by socket ${socketId}:`, error);
      return null;
    }
  }

  // Check if user is online
  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const exists = await this.redisService.exists(`ws:user:${userId}`);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Error checking if user ${userId} is online:`, error);
      return false;
    }
  }

  // Store offline messages
  async storeOfflineMessage(userId: string, message: any): Promise<void> {
    try {
      const key = `offline_messages:${userId}`;
      const existingMessages = await this.redisService.get(key);
      const messages = existingMessages ? JSON.parse(existingMessages) : [];

      messages.push({
        ...message,
        storedAt: Date.now(),
      });

      // Keep only last 50 messages and set 7 days TTL
      const recentMessages = messages.slice(-50);
      await this.redisService.set(
        key,
        JSON.stringify(recentMessages),
        7 * 24 * 60 * 60,
      );

      this.logger.log(`Stored offline message for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error storing offline message:`, error);
    }
  }

  // Get offline messages
  async getOfflineMessages(userId: string): Promise<any[]> {
    try {
      const key = `offline_messages:${userId}`;
      const messages = await this.redisService.get(key);

      if (messages) {
        // Clear messages after retrieving
        await this.redisService.del(key);
        return JSON.parse(messages);
      }

      return [];
    } catch (error) {
      this.logger.error(
        `Error getting offline messages for user ${userId}:`,
        error,
      );
      return [];
    }
  }

  // Store user-room mapping (user can be in multiple rooms)
  async addUserToRoom(
    userId: string,
    roomId: string,
    socketId: string,
  ): Promise<void> {
    try {
      // Add room to user's room set
      await this.redisService.sadd(`ws:user_rooms:${userId}`, [roomId]);

      // Add user to room's participant set
      await this.redisService.sadd(`ws:room_participants:${roomId}`, [userId]);

      // Store user's socket in the room
      await this.redisService.hset(
        `ws:room_sockets:${roomId}`,
        userId,
        socketId,
      );

      // Set TTL for cleanup (24 hours)
      await Promise.all([
        this.redisService.expire(`ws:user_rooms:${userId}`, 24 * 60 * 60),
        this.redisService.expire(
          `ws:room_participants:${roomId}`,
          24 * 60 * 60,
        ),
        this.redisService.expire(`ws:room_sockets:${roomId}`, 24 * 60 * 60),
      ]);

      this.logger.log(
        `User ${userId} joined room ${roomId} with socket ${socketId}`,
      );
    } catch (error) {
      this.logger.error(`Error adding user to room:`, error);
      throw error;
    }
  }

  // Remove user from room
  async removeUserFromRoom(userId: string, roomId: string): Promise<void> {
    try {
      // Remove room from user's room set
      await this.redisService.srem(`ws:user_rooms:${userId}`, [roomId]);

      // Remove user from room's participant set
      await this.redisService.srem(`ws:room_participants:${roomId}`, [userId]);

      // Remove user's socket from the room
      await this.redisService.hdel(`ws:room_sockets:${roomId}`, [userId]);

      this.logger.log(`User ${userId} left room ${roomId}`);
    } catch (error) {
      this.logger.error(`Error removing user from room:`, error);
      throw error;
    }
  }

  // Get all rooms a user is in
  async getUserRooms(userId: string): Promise<string[]> {
    try {
      return await this.redisService.smembers(`ws:user_rooms:${userId}`);
    } catch (error) {
      this.logger.error(`Error getting user rooms:`, error);
      return [];
    }
  }
}

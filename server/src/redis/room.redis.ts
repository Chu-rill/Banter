import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RoomRedisService {
  private readonly logger = new Logger(RoomRedisService.name);

  constructor(private readonly redisService: RedisService) {}

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

  async getUserSocketId(userId: string): Promise<string | null> {
    try {
      return await this.redisService.get(`ws:user_socket:${userId}`);
    } catch (error) {
      this.logger.error(`Error getting user socket ID:`, error);
      return null;
    }
  }

  async setUserSocketId(userId: string, socketId: string): Promise<void> {
    try {
      await this.redisService.set(
        `ws:user_socket:${userId}`,
        socketId,
        'EX',
        24 * 60 * 60,
      ); // 24 hours TTL
    } catch (error) {
      this.logger.error(`Error setting user socket ID:`, error);
    }
  }

  // Get a single room that a user belongs to, filtered by a specific roomId (returns socketId if user is in the room, else null)
  async getUsersocketByRoomId(
    userId: string,
    roomId: string,
  ): Promise<string | null> {
    try {
      const isMember = await this.redisService.sismember(
        `ws:user_rooms:${userId}`,
        roomId,
      );
      if (isMember === 1) {
        // Return the socketId for this user in this room
        const socketId = await this.redisService.hget(
          `ws:room_sockets:${roomId}`,
          userId,
        );
        return socketId;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error getting user room by id:`, error);
      return null;
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

  // Get all participants in a room
  async getRoomParticipants(roomId: string): Promise<string[]> {
    try {
      return await this.redisService.smembers(`ws:room_participants:${roomId}`);
    } catch (error) {
      this.logger.error(`Error getting room participants:`, error);
      return [];
    }
  }

  // Get socket ID for specific user in a room
  async getUserSocketInRoom(
    roomId: string,
    userId: string,
  ): Promise<string | null> {
    try {
      return await this.redisService.hget(`ws:room_sockets:${roomId}`, userId);
    } catch (error) {
      this.logger.error(`Error getting user socket in room:`, error);
      return null;
    }
  }

  // Check if user is in a room
  async isUserInRoom(userId: string, roomId: string): Promise<boolean> {
    try {
      const result = await this.redisService.sismember(
        `ws:user_rooms:${userId}`,
        roomId,
      );
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking if user is in room:`, error);
      return false;
    }
  }

  // Get a single room that a user belongs to (returns the first room found or null)
  async getSingleUserRoom(userId: string): Promise<string | null> {
    try {
      const rooms = await this.redisService.smembers(`ws:user_rooms:${userId}`);
      return rooms.length > 0 ? rooms[0] : null;
    } catch (error) {
      this.logger.error(`Error getting single user room:`, error);
      return null;
    }
  }
}

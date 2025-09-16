import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { RoomMessageService } from './room-message.service';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { SendRoomMessageDto } from './validation';
import { RoomRedisService } from 'src/redis/room.redis';
import { RoomService } from 'src/room/room.service';
import { JwtService } from '@nestjs/jwt';
import { RoomConnectionDto } from 'src/room/validation';
import { UserRedisService } from 'src/redis/user.redis';
import { FriendshipService } from 'src/friendship/friendship.service';
import { UserService } from 'src/user/user.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface TypingUser {
  userId: string;
  username: string;
  timestamp: number;
}

interface RoomTypingState {
  roomId: string;
  typingUsers: Map<string, TypingUser>;
}

@WebSocketGateway(5001, {
  namespace: '/room-messages',
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class RoomMessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RoomMessageGateway.name);
  private roomTypingState = new Map<string, RoomTypingState>();
  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messageService: RoomMessageService,
    private readonly roomRedis: RoomRedisService,
    private readonly roomService: RoomService,
    private readonly jwtService: JwtService,
    private readonly userRedis: UserRedisService,
    private readonly friendshipService: FriendshipService,
    private readonly userService: UserService,
  ) {}

  // ===== CONNECTION/DISCONNECTION HANDLERS =====
  async handleConnection(client: AuthenticatedSocket) {
    const userId = await this.authenticateUser(client);
    if (!userId) {
      this.logger.warn(`Authentication failed for client ${client.id}`);
      client.emit('auth_error', { message: 'Authentication failed' });
      client.disconnect();
      return;
    }

    // Store userId in both places for consistency
    client.data.userId = userId;
    client.userId = userId;

    await this.userRedis.setUserSocket(userId, client.id);
    client.join(userId);

    this.server.to(client.id).emit('connection', {
      message: 'Successfully connected to the room message gateway',
      userId,
    });
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    let userId = client.data.userId || client.userId;

    if (!userId) {
      userId = await this.userRedis.getUserBySocket(client.id);
    }

    if (userId) {
      await this.userRedis.removeUserSocket(userId, client.id);
    }
  }

  // ===== AUTHENTICATION METHOD =====
  private async authenticateUser(client: Socket): Promise<string | null> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        const decoded = await this.jwtService.verifyAsync(token);
        return decoded.userId || decoded.sub;
      }

      const userId = client.handshake.query?.userId as string;
      if (userId) {
        return userId;
      }

      return null;
    } catch (error) {
      this.logger.error('Authentication error:', error);
      return null;
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() data: SendRoomMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { roomId, content, mediaUrl, type, mediaType } = data;
    const senderId = client.userId || client.data.userId;
    if (!senderId) {
      this.logger.error('No senderId found');
      client.emit('dm:error', { message: 'Not authenticated' });
      return;
    }

    const room = await this.roomService.findById(roomId);
    if (!room) {
      client.emit('error', { message: 'Room not found' });
      return;
    }

    try {
      // Remove user from typing state when sending message
      // this.removeUserFromTypingState(roomId, userId);

      const canSendMessage = await this.roomService.canMessage(
        roomId,
        senderId,
      );

      if (!canSendMessage) {
        this.logger.warn(`User ${senderId} cannot send message to ${roomId}`);
        client.emit('dm:error', {
          message: 'Cannot send message to this user',
        });
        return;
      }

      const savedMessage = await this.messageService.sendMessage(
        roomId,
        senderId,
        content,
        mediaUrl,
        type,
        mediaType,
      );

      const roomSocketId = await this.roomRedis.getUsersocketByRoomId(
        senderId,
        roomId,
      );

      if (!roomSocketId) {
        return client.emit('message-error', {
          message: 'You are not connected to this room',
          receiverId: data.roomId,
          error: 'not_connected',
        });
      }

      // Send confirmation to sender
      client.emit('message-sent', savedMessage);

      this.server.to(roomSocketId).emit('new-message', savedMessage);
    } catch (error) {
      this.logger.error('Error handling room message:', error);
      client.emit('dm:error', {
        message: 'Failed to send message',
        receiverId: data.roomId,
        error: error.message,
      });
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() data: RoomConnectionDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.userId!;
    const { roomId } = data;
    // Pass client.id as socketId
    const result = await this.roomService.joinRoom(roomId, userId);

    await this.roomRedis.addUserToRoom(userId, roomId, client.id);

    const roomSocketId = await this.roomRedis.getUsersocketByRoomId(
      userId,
      roomId,
    );

    client.join(roomId); // Join the socket.io room
    if (roomSocketId) {
      client.to(roomSocketId).emit('user-joined-room', result);
      client.emit('room-joined', result);
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @MessageBody() data: RoomConnectionDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const userId = client.userId!;
    const { roomId } = data;
    // Pass client.id as socketId
    const result = await this.roomService.leaveRoom(roomId, userId);

    await this.roomRedis.removeUserFromRoom(userId, roomId);

    const roomSocketId = await this.roomRedis.getUsersocketByRoomId(
      userId,
      roomId,
    );

    client.join(data.roomId); // Join the socket.io room
    if (roomSocketId) {
      client.to(roomSocketId).emit('user-left-room', result);
      client.emit('room-left', result);
    }
  }

  @SubscribeMessage('typing-start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.userId!;

    try {
      const user = await this.userService.getUserById(userId);

      if (!user) return;

      // Add user to typing state
      this.addUserToTypingState(roomId, {
        userId,
        username: user.data.username,
        timestamp: Date.now(),
      });

      // Broadcast typing indicator to other users in the room
      client.to(roomId).emit('user-typing', {
        userId,
        username: user.data.username,
        roomId,
      });

      // Set timeout to automatically remove user from typing state
      // const timeoutKey = `${roomId}:${userId}`;
      // if (this.typingTimeouts.has(timeoutKey)) {
      //   clearTimeout(this.typingTimeouts.get(timeoutKey)!);
      // }

      // const timeout = setTimeout(() => {
      //   this.removeUserFromTypingState(roomId, userId);
      //   client.to(roomId).emit('user-stopped-typing', {
      //     userId,
      //     roomId,
      //   });
      //   this.typingTimeouts.delete(timeoutKey);
      // }, 3000); // Stop typing after 3 seconds of inactivity

      // this.typingTimeouts.set(timeoutKey, timeout);
    } catch (error) {
      this.logger.error('Error handling typing start:', error);
    }
  }

  @SubscribeMessage('typing-stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.userId!;

    // Remove user from typing state
    this.removeUserFromTypingState(roomId, userId);

    // Clear timeout
    // const timeoutKey = `${roomId}:${userId}`;
    // if (this.typingTimeouts.has(timeoutKey)) {
    //   clearTimeout(this.typingTimeouts.get(timeoutKey)!);
    //   this.typingTimeouts.delete(timeoutKey);
    // }

    // Broadcast stop typing to other users in the room
    client.to(roomId).emit('user-stopped-typing', {
      userId,
      roomId,
    });
  }

  @SubscribeMessage('mark-messages-read')
  async handleMarkMessagesRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; lastMessageId: string },
  ) {
    const { roomId, lastMessageId } = data;
    const userId = client.userId!;

    try {
      // Update all messages in the room up to lastMessageId as read
      await this.messageService.markMessagesRead(roomId, userId, lastMessageId);

      // Notify other users that messages have been read
      client.to(roomId).emit('messages-read', {
        userId,
        roomId,
        lastMessageId,
        timestamp: new Date(),
      });

      client.emit('messages-marked-read', {
        roomId,
        lastMessageId,
      });
    } catch (error) {
      this.logger.error('Error marking messages as read:', error);
    }
  }

  // Helper methods
  private addUserToTypingState(roomId: string, typingUser: TypingUser) {
    if (!this.roomTypingState.has(roomId)) {
      this.roomTypingState.set(roomId, {
        roomId,
        typingUsers: new Map(),
      });
    }

    const roomState = this.roomTypingState.get(roomId)!;
    roomState.typingUsers.set(typingUser.userId, typingUser);
  }

  private removeUserFromTypingState(roomId: string, userId: string) {
    const roomState = this.roomTypingState.get(roomId);
    if (roomState) {
      roomState.typingUsers.delete(userId);

      // Clean up empty room states
      if (roomState.typingUsers.size === 0) {
        this.roomTypingState.delete(roomId);
      }
    }
  }

  private removeUserFromAllTypingStates(userId: string) {
    for (const [roomId, roomState] of this.roomTypingState.entries()) {
      if (roomState.typingUsers.has(userId)) {
        roomState.typingUsers.delete(userId);

        // Broadcast stop typing
        this.server.to(roomId).emit('user-stopped-typing', {
          userId,
          roomId,
        });

        // Clean up empty room states
        if (roomState.typingUsers.size === 0) {
          this.roomTypingState.delete(roomId);
        }
      }
    }

    // Clear all timeouts for this user
    for (const [key, timeout] of this.typingTimeouts.entries()) {
      if (key.endsWith(`:${userId}`)) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(key);
      }
    }
  }

  async broadcastUserStatus(userId: string, isOnline: boolean) {
    try {
      // Get user's friends
      const data = await this.friendshipService.listFriends(userId);
      const friends = data.data;
      const friendIds = friends.map((friendship) =>
        friendship.requesterId === userId
          ? friendship.receiverId
          : friendship.requesterId,
      );

      // Broadcast status to friends
      for (const friendId of friendIds) {
        const friendSocketId = await this.userRedis.getUserSocket(friendId);
        if (friendSocketId) {
          this.server.to(friendSocketId).emit('friend-status-change', {
            userId,
            isOnline,
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      this.logger.error('Error broadcasting user status:', error);
    }
  }
}

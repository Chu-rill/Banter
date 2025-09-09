import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RoomMessageService } from './room-message.service';
import { RoomService } from '../room/room.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRedisService } from '../redis/user.redis';

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

@WebSocketGateway(5003, {
  namespace: '/messages',
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class EnhancedMessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EnhancedMessageGateway.name);
  private roomTypingState = new Map<string, RoomTypingState>();
  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly messageService: RoomMessageService,
    private readonly roomService: RoomService,
    private readonly prisma: PrismaService,
    private readonly userRedis: UserRedisService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const userId = await this.authenticateUser(client);
      if (!userId) {
        this.logger.warn(`Authentication failed for client ${client.id}`);
        client.disconnect();
        return;
      }

      client.userId = userId;
      
      // Set user online status
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastSeen: new Date() },
      });

      this.logger.log(`User ${userId} connected to messages namespace`);
      
      client.emit('connected', { 
        message: 'Connected to messaging server',
        userId 
      });

      // Broadcast user online status to friends
      await this.broadcastUserStatus(userId, true);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;
    if (userId) {
      // Set user offline status
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen: new Date() },
      });

      // Remove user from all typing states
      this.removeUserFromAllTypingStates(userId);

      // Broadcast user offline status to friends
      await this.broadcastUserStatus(userId, false);

      this.logger.log(`User ${userId} disconnected from messages namespace`);
    }
  }

  private async authenticateUser(client: Socket): Promise<string | null> {
    try {
      const token = 
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        const decoded = await this.jwtService.verifyAsync(token);
        return decoded.userId;
      }

      return null;
    } catch (error) {
      this.logger.error('Authentication error:', error);
      return null;
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.userId!;

    try {
      // Verify user can access the room
      const room = await this.prisma.room.findFirst({
        where: {
          id: roomId,
          OR: [
            { participants: { some: { id: userId } } },
            { creatorId: userId },
          ],
        },
        include: {
          participants: {
            select: { id: true, username: true, avatar: true, isOnline: true },
          },
        },
      });

      if (!room) {
        client.emit('error', { message: 'Room not found or access denied' });
        return;
      }

      // Join the socket room
      client.join(roomId);
      
      // Notify other room members that user joined
      client.to(roomId).emit('user-joined-room', {
        userId,
        roomId,
        timestamp: new Date(),
      });

      client.emit('room-joined', {
        roomId,
        participants: room.participants,
        message: `Joined room: ${room.name}`,
      });

      this.logger.log(`User ${userId} joined room ${roomId}`);
    } catch (error) {
      this.logger.error('Error joining room:', error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.userId!;

    // Remove user from typing state
    this.removeUserFromTypingState(roomId, userId);

    // Leave the socket room
    client.leave(roomId);
    
    // Notify other room members that user left
    client.to(roomId).emit('user-left-room', {
      userId,
      roomId,
      timestamp: new Date(),
    });

    client.emit('room-left', { roomId });
    this.logger.log(`User ${userId} left room ${roomId}`);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      roomId: string;
      content: string;
      type?: 'TEXT' | 'MEDIA' | 'VOICE';
      mediaUrl?: string;
      mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
    },
  ) {
    const { roomId, content, type = 'TEXT', mediaUrl, mediaType } = data;
    const userId = client.userId!;

    try {
      // Remove user from typing state when sending message
      this.removeUserFromTypingState(roomId, userId);

      // Validate message
      if (!content?.trim() && !mediaUrl) {
        client.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      // Verify user can send message to this room
      const canMessage = await this.roomService.canMessage(roomId, userId);
      if (!canMessage) {
        client.emit('error', { message: 'Cannot send message to this room' });
        return;
      }

      // Save message to database
      const savedMessage = await this.messageService.sendMessage(
        roomId,
        userId,
        content,
        type,
        mediaUrl,
        mediaType,
      );

      // Send message to all room participants
      this.server.to(roomId).emit('new-message', {
        ...savedMessage,
        isOwn: false,
      });

      // Send confirmation to sender with isOwn: true
      client.emit('message-sent', {
        ...savedMessage,
        isOwn: true,
      });

      this.logger.log(`Message sent by ${userId} in room ${roomId}`);
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
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
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      if (!user) return;

      // Add user to typing state
      this.addUserToTypingState(roomId, {
        userId,
        username: user.username,
        timestamp: Date.now(),
      });

      // Broadcast typing indicator to other users in the room
      client.to(roomId).emit('user-typing', {
        userId,
        username: user.username,
        roomId,
      });

      // Set timeout to automatically remove user from typing state
      const timeoutKey = `${roomId}:${userId}`;
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey)!);
      }

      const timeout = setTimeout(() => {
        this.removeUserFromTypingState(roomId, userId);
        client.to(roomId).emit('user-stopped-typing', {
          userId,
          roomId,
        });
        this.typingTimeouts.delete(timeoutKey);
      }, 3000); // Stop typing after 3 seconds of inactivity

      this.typingTimeouts.set(timeoutKey, timeout);
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
    const timeoutKey = `${roomId}:${userId}`;
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey)!);
      this.typingTimeouts.delete(timeoutKey);
    }

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
      await this.prisma.message.updateMany({
        where: {
          roomId,
          userId: { not: userId }, // Don't mark own messages as read
          createdAt: {
            lte: (await this.prisma.message.findUnique({
              where: { id: lastMessageId },
              select: { createdAt: true },
            }))?.createdAt,
          },
        },
        data: { isRead: true },
      });

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

  @SubscribeMessage('get-room-messages')
  async handleGetRoomMessages(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { 
      roomId: string; 
      limit?: number; 
      cursor?: string;
    },
  ) {
    const { roomId, limit = 50, cursor } = data;
    const userId = client.userId!;

    try {
      // Verify user has access to the room
      const hasAccess = await this.roomService.canMessage(roomId, userId);
      if (!hasAccess) {
        client.emit('error', { message: 'Access denied to room' });
        return;
      }

      const messages = await this.messageService.getRoomMessages(roomId, limit, cursor);
      
      client.emit('room-messages', {
        roomId,
        messages,
        hasMore: messages.length === limit,
      });
    } catch (error) {
      this.logger.error('Error fetching room messages:', error);
      client.emit('error', { message: 'Failed to fetch messages' });
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

  private async broadcastUserStatus(userId: string, isOnline: boolean) {
    try {
      // Get user's friends
      const friends = await this.prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: userId },
            { receiverId: userId },
          ],
          status: 'ACCEPTED',
        },
        select: {
          requesterId: true,
          receiverId: true,
        },
      });

      const friendIds = friends.map(friendship => 
        friendship.requesterId === userId 
          ? friendship.receiverId 
          : friendship.requesterId
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

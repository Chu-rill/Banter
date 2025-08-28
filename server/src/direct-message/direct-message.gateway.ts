import {
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { DirectMessageService } from './direct-message.service';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { SendDirectMessageDto } from './validation';
import { WsAuthGuard } from 'src/guards/ws.auth.guard';
import { WsUser } from 'src/utils/decorator/ws.decorator';
import { UserRedisService } from 'src/redis/user.redis';
import { FriendshipRepository } from 'src/friendship/friendship.repository';
import { MediaType, MessageType } from '@generated/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway(5001, {
  cors: {
    origin: '*',
    // origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    // methods: ['GET', 'POST'],
  },
})
export class DirectMessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DirectMessageGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly service: DirectMessageService,
    private readonly userRedis: UserRedisService,
    private readonly friendshipRepo: FriendshipRepository,
    private readonly jwtService: JwtService,
  ) {}

  // ===== CONNECTION/DISCONNECTION HANDLERS =====
  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`User attempting connection: ${client.id}`);

    const userId = await this.authenticateUser(client);
    if (!userId) {
      this.logger.warn(`Authentication failed for client ${client.id}`);
      client.emit('auth_error', { message: 'Authentication failed' });
      client.disconnect();
      return;
    }

    this.logger.log(`User connected: ${client.id} - User ID: ${userId}`);

    // Store userId in both places for consistency
    client.data.userId = userId;
    client.userId = userId;

    await this.userRedis.setUserSocket(userId, client.id);

    // Join user to their personal room (using userId as room name)
    client.join(userId);

    this.server.to(client.id).emit('connection', {
      message: 'Successfully connected to the server',
      userId,
    });

    // Deliver offline messages when user connects
    await this.deliverOfflineMessages(client, userId);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    // Try to get userId from client data first, then fallback to Redis lookup
    let userId = client.data.userId || client.userId;

    if (!userId) {
      userId = await this.userRedis.getUserBySocket(client.id);
    }

    if (userId) {
      await this.userRedis.removeUserSocket(userId, client.id);
      this.logger.log(`User ${userId} (${client.id}) disconnected`);
    } else {
      this.logger.log(`Unknown user ${client.id} disconnected`);
    }
  }

  // ===== AUTHENTICATION METHOD =====
  private async authenticateUser(client: Socket): Promise<string | null> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        // Verify JWT and extract user ID
        const decoded = await this.jwtService.verifyAsync(token);
        return decoded.userId || decoded.sub;
      }

      const userId = client.handshake.query?.userId as string;
      if (userId) {
        // Optionally validate user exists in DB
        return userId;
      }

      return null;
    } catch (error) {
      this.logger.error('Authentication error:', error);
      return null;
    }
  }

  // ===== DELIVER OFFLINE MESSAGES =====
  private async deliverOfflineMessages(client: Socket, userId: string) {
    try {
      const offlineMessages = await this.userRedis.getOfflineMessages(userId);

      if (offlineMessages.length > 0) {
        client.emit('dm:offline_messages', {
          messages: offlineMessages,
          count: offlineMessages.length,
        });

        this.logger.log(
          `Delivered ${offlineMessages.length} offline messages to user ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error('Error delivering offline messages:', error);
    }
  }

  // ===== MESSAGE HANDLERS =====
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('dm:send')
  async handleDirectMessage(
    @MessageBody()
    data: SendDirectMessageDto,
    @ConnectedSocket() client: Socket,
    @WsUser() senderId: string,
  ) {
    const { receiverId, content, mediaUrl, type, mediaType } = data;

    if (!senderId) {
      this.logger.error('No senderId found');
      client.emit('dm:error', { message: 'Not authenticated' });
      return;
    }

    client.emit('dm:new', data);

    // Send to receiver's socket using this.server (not gateway.server)
    this.server.emit('dm:new', data);

    try {
      // Check friendship status
      this.logger.log(
        `Checking if ${senderId} can send message to ${receiverId}`,
      );

      const canSendMessage = await this.friendshipRepo.canSendMessage(
        senderId,
        receiverId,
      );

      this.logger.log(`Can send message: ${canSendMessage}`);

      if (!canSendMessage) {
        this.logger.warn(
          `User ${senderId} cannot send message to ${receiverId}`,
        );
        client.emit('dm:error', {
          message: 'Cannot send message to this user',
        });
        return;
      }

      // Save message to database
      this.logger.log(`Saving message to database...`);
      const savedMessage = await this.service.sendDirectMessage(
        senderId,
        receiverId,
        content,
        mediaUrl,
        type,
        mediaType,
      );

      this.logger.log('Saved message:', savedMessage);

      // Get receiver's socket ID from Redis
      const receiverSocketId = await this.userRedis.getUserSocket(
        data.receiverId,
      );
      this.logger.log(
        `Receiver ${data.receiverId} socket ID: ${receiverSocketId}`,
      );

      // Send confirmation to sender
      client.emit('dm:sent', savedMessage);
      this.logger.log(`Sent confirmation to sender ${senderId}`);

      if (receiverSocketId) {
        // Receiver is online - send to both sender and receiver

        // Send to sender's socket (so they see their own message in chat)
        client.emit('dm:new', savedMessage);
        this.logger.log(`Sent dm:new to sender socket ${client.id}`);

        // Send to receiver's socket using this.server (not gateway.server)
        this.server.to(receiverSocketId).emit('dm:new', savedMessage);
        this.logger.log(`Sent dm:new to receiver socket ${receiverSocketId}`);

        this.logger.log(`Message delivered to online user ${data.receiverId}`);
      } else {
        // Receiver is offline - store message for later delivery
        this.logger.log(
          `Receiver ${data.receiverId} is offline, storing message`,
        );
        await this.userRedis.storeOfflineMessage(data.receiverId, savedMessage);

        // Send to sender anyway (they should see their own message)
        client.emit('dm:new', savedMessage);
        this.logger.log(
          `Sent dm:new to sender socket ${client.id} (receiver offline)`,
        );

        // Notify sender that recipient is offline
        client.emit('dm:recipient_offline', {
          receiverId: data.receiverId,
          messageId: savedMessage.id,
        });
        this.logger.log(`Notified sender that recipient is offline`);
      }

      this.logger.log(
        `Successfully handled direct message from ${senderId} to ${data.receiverId}`,
      );
    } catch (error) {
      this.logger.error('Error handling direct message:', error);
      this.logger.error('Error stack:', error.stack);
      client.emit('dm:error', {
        message: 'Failed to send message',
        receiverId: data.receiverId,
        error: error.message,
      });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('dm:typing')
  async handleTyping(
    @MessageBody() data: { receiverId: string; typing: boolean },
    @ConnectedSocket() client: Socket,
    @WsUser() senderId: string,
  ) {
    this.logger.log(
      `Typing indicator from ${senderId} to ${data.receiverId}: ${data.typing}`,
    );

    try {
      const receiverSocketId = await this.userRedis.getUserSocket(
        data.receiverId,
      );

      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('dm:typing', {
          senderId,
          typing: data.typing,
        });
        this.logger.log(`Typing indicator sent to ${data.receiverId}`);
      } else {
        this.logger.log(
          `Receiver ${data.receiverId} is offline, skipping typing indicator`,
        );
      }
    } catch (error) {
      this.logger.error('Error handling typing indicator:', error);
    }
  }

  // @UseGuards(WsAuthGuard)
  // @SubscribeMessage('dm:mark_read')
  // async handleMarkAsRead(
  //   @MessageBody() data: { messageIds: string[]; senderId: string },
  //   @ConnectedSocket() client: Socket,
  //   @WsUser() userId: string,
  // ) {
  //   try {
  //     // Update messages as read in database
  //     await this.service.markMessagesAsRead(data.messageIds, userId);

  //     // Get sender's socket ID to notify them
  //     const senderSocketId = await this.userRedis.getUserSocket(data.senderId);

  //     if (senderSocketId) {
  //       // Notify sender that their messages were read
  //       this.server.to(senderSocketId).emit('dm:read_receipt', {
  //         messageIds: data.messageIds,
  //         readBy: userId,
  //         readAt: new Date(),
  //       });
  //     }

  //     // Confirm to the reader
  //     client.emit('dm:marked_read', {
  //       messageIds: data.messageIds,
  //     });

  //   } catch (error) {
  //     this.logger.error('Error marking messages as read:', error);
  //     client.emit('dm:error', {
  //       message: 'Failed to mark messages as read',
  //     });
  //   }
  // }

  // Get online status of users
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('user:check_online')
  async handleCheckOnline(
    @MessageBody() data: { userIds: string[] },
    @ConnectedSocket() client: Socket,
    @WsUser() userId: string,
  ) {
    try {
      const onlineStatuses = await Promise.all(
        data.userIds.map(async (targetUserId) => ({
          userId: targetUserId,
          isOnline: await this.userRedis.isUserOnline(targetUserId),
        })),
      );

      client.emit('user:online_status', {
        statuses: onlineStatuses,
      });
    } catch (error) {
      this.logger.error('Error checking online status:', error);
    }
  }

  // Debug method to test connections
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('dm:test')
  async handleTest(
    @ConnectedSocket() client: Socket,
    @WsUser() senderId: string,
  ) {
    this.logger.log(`Test message from user ${senderId}, socket ${client.id}`);

    // Test if basic emit works
    client.emit('dm:test_response', {
      message: 'Test successful',
      userId: senderId,
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Test response sent to ${senderId}`);
  }

  // Test broadcast
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('test:broadcast')
  async handleTestBroadcast(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
    @WsUser() senderId: string,
  ) {
    this.logger.log(`Broadcasting test message from ${senderId}`);

    // Broadcast to all connected clients
    this.server.emit('test:broadcast_received', {
      from: senderId,
      data: data,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Test broadcast sent`);
  }
}

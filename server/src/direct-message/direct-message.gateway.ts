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
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { SendDirectMessageDto } from './validation';
import { WsAuthGuard } from 'src/guards/ws.auth.guard';
import { WsUser } from 'src/utils/decorator/ws.decorator';
import { UserRedisService } from 'src/redis/user.redis';
import { FriendshipService } from 'src/friendship/friendship.service';

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
    private readonly friendshipService: FriendshipService,
    private readonly jwtService: JwtService,
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

    this.logger.log(`User connected: ${userId} (${client.id})`);

    // Store userId in both places for consistency
    client.data.userId = userId;
    client.userId = userId;

    await this.userRedis.setUserSocket(userId, client.id);
    client.join(userId);

    this.server.to(client.id).emit('connection', {
      message: 'Successfully connected to the direct message gateway',
      userId,
    });

    await this.deliverOfflineMessages(client, userId);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    let userId = client.data.userId || client.userId;

    if (!userId) {
      userId = await this.userRedis.getUserBySocket(client.id);
    }

    if (userId) {
      await this.userRedis.removeUserSocket(userId, client.id);
      this.logger.log(`User ${userId} disconnected`);
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

    try {
      const canSendMessage = await this.friendshipService.canSendMessage(
        senderId,
        receiverId,
      );

      if (!canSendMessage) {
        this.logger.warn(
          `User ${senderId} cannot send message to ${receiverId}`,
        );
        client.emit('dm:error', {
          message: 'Cannot send message to this user',
        });
        return;
      }

      const savedMessage = await this.service.sendDirectMessage(
        senderId,
        receiverId,
        content,
        mediaUrl,
        type,
        mediaType,
      );

      const receiverSocketId = await this.userRedis.getUserSocket(receiverId);

      // Send confirmation to sender
      client.emit('dm:sent', savedMessage);

      if (receiverSocketId) {
        // Receiver is online - send to and receiver
        this.server.to(receiverSocketId).emit('dm:new', savedMessage);
        this.logger.log(`Message delivered to online user ${receiverId}`);
      } else {
        // Receiver is offline - store message for later delivery
        await this.userRedis.storeOfflineMessage(receiverId, savedMessage);
        client.emit('dm:new', savedMessage);
        client.emit('dm:recipient_offline', {
          receiverId,
          messageId: savedMessage.id,
        });
        this.logger.log(`Message stored for offline user ${receiverId}`);
      }
    } catch (error) {
      this.logger.error('Error handling direct message:', error);
      client.emit('dm:error', {
        message: 'Failed to send message',
        receiverId,
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
    try {
      const receiverSocketId = await this.userRedis.getUserSocket(
        data.receiverId,
      );

      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('dm:typing', {
          senderId,
          typing: data.typing,
        });
      }
    } catch (error) {
      this.logger.error('Error handling typing indicator:', error);
    }
  }

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
    client.emit('dm:test_response', {
      message: 'Test successful',
      userId: senderId,
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  // Test broadcast
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('test:broadcast')
  async handleTestBroadcast(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
    @WsUser() senderId: string,
  ) {
    this.server.emit('test:broadcast_received', {
      from: senderId,
      data: data,
      timestamp: new Date().toISOString(),
    });
  }
}

import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { RedisModule } from 'src/redis/redis.module';
import { WebSocketService } from './websocket.service';

@Module({
  providers: [AppGateway, WebSocketService],
  exports: [AppGateway, WebSocketService],
  imports: [RedisModule],
})
export class GatewayModule {}

export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly wsUserService: WebSocketUserService) {}

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      const userId = await this.authenticateUser(client);

      if (userId) {
        // Store mapping in Redis
        await this.wsUserService.setUserSocket(userId, client.id);

        // Attach userId to socket
        client.userId = userId;

        // Join user to their personal room (using userId as room name)
        client.join(userId);

        this.logger.log(`User ${userId} authenticated and connected`);

        // Send offline messages if any
        const offlineMessages =
          await this.wsUserService.getOfflineMessages(userId);
        if (offlineMessages.length > 0) {
          client.emit('offline:messages', offlineMessages);
          this.logger.log(
            `Sent ${offlineMessages.length} offline messages to user ${userId}`,
          );
        }

        client.emit('connection', {
          message: 'Successfully connected to the server',
          userId: userId,
        });
      } else {
        this.logger.warn(`Authentication failed for client ${client.id}`);
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId =
      client.userId || (await this.wsUserService.getUserBySocket(client.id));

    if (userId) {
      await this.wsUserService.removeUserSocket(userId, client.id);
      this.logger.log(`User ${userId} (${client.id}) disconnected`);
    } else {
      this.logger.log(`Unknown client disconnected: ${client.id}`);
    }
  }

  // Main method to send message to user by database ID
  async sendMessageToUser(
    userId: string,
    event: string,
    data: any,
  ): Promise<boolean> {
    try {
      // Check if user is online
      const isOnline = await this.wsUserService.isUserOnline(userId);

      if (isOnline) {
        // Send to user's room (userId is the room name)
        this.server.to(userId).emit(event, data);
        this.logger.log(`Message sent to online user ${userId}`);
        return true;
      } else {
        // Store for offline delivery
        await this.wsUserService.storeOfflineMessage(userId, {
          event,
          data,
          timestamp: new Date(),
        });
        this.logger.log(`Message stored for offline user ${userId}`);
        return false; // User not online, but message stored
      }
    } catch (error) {
      this.logger.error(`Error sending message to user ${userId}:`, error);
      return false;
    }
  }

  @SubscribeMessage('dm:send')
  async handleDirectMessage(
    @MessageBody() data: { receiverId: string; message: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const senderId = client.userId;

    if (!senderId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      // Save message to database (implement this method)
      const savedMessage = await this.saveMessageToDatabase({
        senderId,
        receiverId: data.receiverId,
        content: data.message,
        timestamp: new Date(),
      });

      // Send to receiver
      const delivered = await this.sendMessageToUser(
        data.receiverId,
        'dm:new',
        {
          id: savedMessage.id,
          senderId,
          message: data.message,
          timestamp: savedMessage.timestamp,
        },
      );

      // Confirm to sender
      client.emit('dm:sent', {
        id: savedMessage.id,
        receiverId: data.receiverId,
        message: data.message,
        timestamp: savedMessage.timestamp,
        delivered, // true if user was online, false if stored offline
      });
    } catch (error) {
      this.logger.error('Error handling direct message:', error);
      client.emit('dm:error', {
        message: 'Failed to send message',
        receiverId: data.receiverId,
      });
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    await this.sendMessageToUser(data.receiverId, 'typing:start', {
      senderId: client.userId,
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    await this.sendMessageToUser(data.receiverId, 'typing:stop', {
      senderId: client.userId,
    });
  }

  // Check if a user is online (useful for your other services)
  async isUserOnline(userId: string): Promise<boolean> {
    return await this.wsUserService.isUserOnline(userId);
  }

  // Authentication method - implement based on your auth strategy
  private async authenticateUser(client: Socket): Promise<string | null> {
    try {
      // Option 1: JWT from auth header or handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        // Verify JWT and extract user ID
        // const decoded = await this.jwtService.verify(token);
        // return decoded.userId;

        // For now, return a mock user ID
        // TODO: Implement actual JWT verification
        return 'user123'; // Replace with actual JWT verification
      }

      // Option 2: User ID from query params (less secure, use for development)
      const userId = client.handshake.query?.userId as string;
      if (userId) {
        // TODO: Validate user exists in database
        return userId;
      }

      return null;
    } catch (error) {
      this.logger.error('Authentication error:', error);
      return null;
    }
  }

  // Implement this method in your message service
  private async saveMessageToDatabase(messageData: {
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Date;
  }): Promise<{ id: string; timestamp: Date }> {
    // TODO: Implement actual database save
    // Example: return await this.messageService.create(messageData);

    // Mock implementation for now
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: messageData.timestamp,
    };
  }
}

import {
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { DirectMessageService } from './direct-message.service';
import { Injectable, Logger } from '@nestjs/common';
import { AppGateway } from 'src/gateway/app.gateway';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@Injectable()
export class DirectMessageGateway {
  private readonly logger = new Logger(DirectMessageGateway.name);

  constructor(
    private readonly service: DirectMessageService,
    private readonly gateway: AppGateway,
  ) {}

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
      // Save message to database
      const savedMessage = await this.service.sendDirectMessage(
        senderId,
        data.receiverId,
        data.message,
      );

      // Notify both sender and receiver
      this.gateway.server.to(senderId).emit('dm:new', savedMessage);
      this.gateway.server.to(data.receiverId).emit('dm:new', savedMessage);
    } catch (error) {
      this.logger.error('Error handling direct message:', error);
      client.emit('dm:error', {
        message: 'Failed to send message',
        receiverId: data.receiverId,
      });
    }
  }
}

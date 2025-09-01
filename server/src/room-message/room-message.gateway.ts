import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { RoomMessageService } from './room-message.service';
import { AppGateway } from 'src/gateway/app.gateway';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from 'src/guards/ws.auth.guard';
import { SendRoomMessageDto } from './validation';
import { RoomRedisService } from 'src/redis/room.redis';
import { WsUser } from 'src/utils/decorator/ws.decorator';
import { RoomService } from 'src/room/room.service';

@WebSocketGateway(5001, { cors: { origin: '*' } })
export class RoomMessageGateway {
  private readonly logger = new Logger(RoomMessageGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messageService: RoomMessageService,
    private readonly roomRedisService: RoomRedisService,
    private readonly roomService: RoomService,
  ) {}

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: SendRoomMessageDto,
    @ConnectedSocket() client: Socket,
    @WsUser() senderId: string,
  ) {
    const { roomId, content, mediaUrl, type, mediaType } = data;

    if (!senderId) {
      this.logger.error('No senderId found');
      client.emit('dm:error', { message: 'Not authenticated' });
      return;
    }

    try {
      this.logger.log(`Checking if ${senderId} can send message to ${roomId}`);

      const canSendMessage = await this.roomService.canMessage(
        senderId,
        roomId,
      );

      this.logger.log(`Can send message: ${canSendMessage}`);

      if (!canSendMessage) {
        this.logger.warn(`User ${senderId} cannot send message to ${roomId}`);
        client.emit('dm:error', {
          message: 'Cannot send message to this user',
        });
        return;
      }

      this.logger.log(`Saving message to database...`);
      const savedMessage = await this.messageService.sendMessage(
        senderId,
        roomId,
        content,
        mediaUrl,
        type,
        mediaType,
      );
    } catch (error) {
      this.logger.error('Error handling room message:', error);
      this.logger.error('Error stack:', error.stack);
      client.emit('dm:error', {
        message: 'Failed to send message',
        receiverId: data.roomId,
        error: error.message,
      });
    }
  }
}

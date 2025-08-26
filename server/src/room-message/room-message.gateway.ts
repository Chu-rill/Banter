import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';

import { RoomMessageService } from './room-message.service';
import { AppGateway } from 'src/gateway/app.gateway';

@WebSocketGateway(5002, { cors: { origin: '*' } })
export class RoomMessageGateway {
  constructor(
    private messageService: RoomMessageService,
    private gateway: AppGateway,
  ) {}

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: { roomId: string; userId: string; content: string },
  ) {
    const message = await this.messageService.sendMessage(
      data.roomId,
      data.userId,
      data.content,
    );
    // Broadcast to all room participants
    this.gateway.server.to(data.roomId).emit('message:new', message);
  }
}

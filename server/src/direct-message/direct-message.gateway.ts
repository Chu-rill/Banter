import { SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { DirectMessageService } from './direct-message.service';
import { Injectable } from '@nestjs/common';
import { AppGateway } from 'src/gateway/app.gateway';

@Injectable()
export class DirectMessageGateway {
  constructor(
    private readonly service: DirectMessageService,
    private gateway: AppGateway,
  ) {}

  @SubscribeMessage('dm:send')
  async handleSendDM(
    @MessageBody()
    data: {
      senderId: string;
      receiverId: string;
      content: string;
    },
    // message:MessageDto
  ) {
    const msg = await this.service.sendDirectMessage(
      data.senderId,
      data.receiverId,
      data.content,
    );

    // Notify both sender and receiver
    this.gateway.server.to(data.senderId).emit('dm:new', msg);
    this.gateway.server.to(data.receiverId).emit('dm:new', msg);
  }
}

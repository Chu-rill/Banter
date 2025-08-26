import { Module } from '@nestjs/common';
import { RoomMessageService } from './room-message.service';
import { RoomMessageGateway } from './room-message.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RoomMessageRepository } from './room-message.repository';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  providers: [RoomMessageGateway, RoomMessageService, RoomMessageRepository],
  imports: [PrismaModule, GatewayModule],
  exports: [RoomMessageService],
})
export class RoomMessageModule {}

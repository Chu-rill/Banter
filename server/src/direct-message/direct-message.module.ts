import { Module } from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageGateway } from './direct-message.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DirectMessageRepository } from './direct-message-repository';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  providers: [
    DirectMessageGateway,
    DirectMessageService,
    DirectMessageRepository,
  ],
  imports: [PrismaModule, GatewayModule],
})
export class DirectMessageModule {}

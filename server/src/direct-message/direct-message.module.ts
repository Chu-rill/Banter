import { Module } from '@nestjs/common';
import { DirectMessageService } from './direct-message.service';
import { DirectMessageGateway } from './direct-message.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DirectMessageRepository } from './direct-message-repository';
import { GatewayModule } from 'src/gateway/gateway.module';
import { RedisModule } from 'src/redis/redis.module';
import { JwtModule } from '@nestjs/jwt';
import { FriendshipModule } from 'src/friendship/friendship.module';

@Module({
  providers: [
    DirectMessageGateway,
    DirectMessageService,
    DirectMessageRepository,
  ],
  imports: [
    PrismaModule,
    GatewayModule,
    RedisModule,
    FriendshipModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2h' },
    }),
  ],
})
export class DirectMessageModule {}

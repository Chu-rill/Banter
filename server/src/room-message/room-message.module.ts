import { forwardRef, Module } from '@nestjs/common';
import { RoomMessageService } from './room-message.service';
import { RoomMessageGateway } from './room-message.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RoomMessageRepository } from './room-message.repository';
import { GatewayModule } from 'src/gateway/gateway.module';
import { RedisModule } from 'src/redis/redis.module';
import { JwtModule } from '@nestjs/jwt';
import { RoomModule } from 'src/room/room.module';

@Module({
  providers: [RoomMessageGateway, RoomMessageService, RoomMessageRepository],
  imports: [
    PrismaModule,
    GatewayModule,
    RedisModule,
    forwardRef(() => RoomModule),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2h' },
    }),
  ],
  exports: [RoomMessageService],
})
export class RoomMessageModule {}

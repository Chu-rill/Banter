import { forwardRef, Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RoomRepository } from './room.repository';
import { RoomAdminController } from './room.admin.controller';
import { RoomMessageModule } from 'src/room-message/room-message.module';
import { UserModule } from 'src/user/user.module';
import { GatewayModule } from 'src/gateway/gateway.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => RoomMessageModule),
    UserModule,
    GatewayModule,
    RedisModule,
  ],
  providers: [RoomService, RoomRepository],
  controllers: [RoomController, RoomAdminController],
  exports: [RoomService],
})
export class RoomModule {}

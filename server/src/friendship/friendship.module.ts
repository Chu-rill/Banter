import { Module } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { FriendshipController } from './friendship.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FriendshipRepository } from './friendship.repository';
import { UserModule } from 'src/user/user.module';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  controllers: [FriendshipController],
  providers: [FriendshipService, FriendshipRepository],
  imports: [PrismaModule, GatewayModule, UserModule],
})
export class FriendshipModule {}

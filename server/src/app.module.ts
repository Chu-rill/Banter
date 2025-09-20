import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { EmailAndPasswordAuthModule } from './auth/email-password-auth/email-password-auth.module';
import { UserModule } from './user/user.module';
import { RoomModule } from './room/room.module';
import { GatewayModule } from './gateway/gateway.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { RoomMessageModule } from './room-message/room-message.module';
import { CallModule } from './call/call.module';
import { FriendshipModule } from './friendship/friendship.module';
import { DirectMessageModule } from './direct-message/direct-message.module';
import { RedisModule } from './redis/redis.module';
import { OauthModule } from './auth/oauth/oauth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60, // 1 min
        limit: 20, // 20 requests per minute
      },
      {
        name: 'auth',
        ttl: 60, // 1 min
        limit: 5, // max 5 login attempts per min
      },
      {
        name: 'forgot',
        ttl: 900, // 15 mins
        limit: 3, // max 3 reset requests per 15 mins
      },
    ]),
    PrismaModule,
    EmailAndPasswordAuthModule,
    UserModule,
    RoomModule,
    GatewayModule,
    EmailModule,
    RoomMessageModule,
    CallModule,
    FriendshipModule,
    DirectMessageModule,
    RedisModule,
    OauthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

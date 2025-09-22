import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { RedisModule } from 'src/redis/redis.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [AppGateway],
  exports: [AppGateway],
  imports: [
    RedisModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2h' },
    }),
  ],
})
export class GatewayModule {}

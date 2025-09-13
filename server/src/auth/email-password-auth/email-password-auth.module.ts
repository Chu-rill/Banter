import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './email-password-auth.service';
import { AuthController } from './email-password-auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { EmailModule } from 'src/email/email.module';
import { RoomMessageModule } from 'src/room-message/room-message.module';

@Module({
  imports: [
    UserModule,
    EmailModule,
    RoomMessageModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2h' },
    }),
    ConfigModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class EmailAndPasswordAuthModule {}

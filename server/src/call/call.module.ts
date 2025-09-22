import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CallService } from './call.service';
import { CallController } from './call.controller';
import { CallGateway } from './call.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { CallRepository } from './call.repository';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRE || '7d' },
    }),
  ],
  controllers: [CallController],
  providers: [CallService, CallGateway, CallRepository],
  exports: [CallService, CallGateway],
})
export class CallModule {}

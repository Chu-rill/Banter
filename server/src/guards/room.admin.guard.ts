import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthRequest } from '../types/auth.request';

@Injectable()
export class RoomAdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    // JWT Authentication logic from JwtAuthGuard
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    let user;
    try {
      const payload = await this.jwtService.verifyAsync(token);
      user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          isOnline: true,
        },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      request.user = user;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Room admin authorization logic
    const roomId = request.params.id || request.body.roomId;

    if (!roomId) {
      throw new ForbiddenException('Room ID is required');
    }

    // Find room
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, creatorId: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if the user is the creator
    if (room.creatorId !== user.id) {
      throw new ForbiddenException(
        'Only the room creator can perform this action',
      );
    }

    return true;
  }
}

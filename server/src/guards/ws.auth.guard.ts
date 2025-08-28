import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: AuthenticatedSocket = context.switchToWs().getClient();

      // Check if userId is already set from connection handler
      let userId = client.data.userId || client.userId;

      // If not set, authenticate now
      if (!userId) {
        userId = await this.authenticateSocket(client);

        if (!userId) {
          throw new WsException('Authentication failed');
        }

        // Store userId in socket data for later use
        client.data.userId = userId;
        client.userId = userId;
      }

      return true;
    } catch (error) {
      this.logger.error('WebSocket authentication error:', error);
      throw new WsException('Authentication failed');
    }
  }

  private async authenticateSocket(client: Socket): Promise<string | null> {
    try {
      // Try to get token from auth or headers
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        // Verify JWT and extract user ID
        const decoded = await this.jwtService.verifyAsync(token);
        return decoded.userId || decoded.sub;
      }

      // Fallback to query parameter (less secure, use with caution)
      const userId = client.handshake.query?.userId as string;
      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            isOnline: true,
          },
        });
        if (!user) {
          return null;
        }
        return userId;
      }

      return null;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      return null;
    }
  }
}

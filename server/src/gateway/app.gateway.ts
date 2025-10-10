import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserRedisService } from 'src/redis/user.redis';
interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    // origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    // methods: ['GET', 'POST'],
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly userRedis: UserRedisService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`User connected: ${client.id}`);

    const userId = await this.authenticateUser(client);
    if (!userId) {
      this.logger.warn(`Authentication failed for client ${client.id}`);
      client.disconnect();
      return;
    }
    this.logger.log(`User ID: ${userId}`);

    await this.userRedis.setUserSocket(userId, client.id);

    // Attach userId to socket for later use
    client.data.userId = userId;

    // Join user to their personal room (using userId as room name)
    client.join(userId);

    this.server.to(client.id).emit('connection', {
      message: 'Successfully connected to the server',
      userId,
    });
  }

  async handleDisconnect(client: any) {
    const userId =
      client.userId || (await this.userRedis.getUserBySocket(client.id));
    if (userId) {
      await this.userRedis.removeUserSocket(userId, client.id);
      this.logger.log(`User ${userId} (${client.id}) disconnected`);
    } else {
      this.logger.log(`Unknown user ${client.id} disconnected`);
    }
  }

  private async authenticateUser(client: Socket): Promise<string | null> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        // Verify JWT and extract user ID
        const decoded = await this.jwtService.verifyAsync(token);
        return decoded.userId; // Adjust based on your JWT payload
      }

      const userId = client.handshake.query?.userId as string;
      if (userId) {
        // Optionally validate user exists in DB
        return userId;
      }

      return null;
    } catch (error) {
      this.logger.error('Authentication error:', error);
      return null;
    }
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { target: string; offer: any; caller: string },
  ) {
    const { target, offer, caller } = data;
    this.server.to(target).emit('offer', { offer, caller });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { target: string; answer: any },
  ) {
    const { target, answer } = data;
    this.server.to(target).emit('answer', { answer, answerer: client.id });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { target: string; candidate: any },
  ) {
    const { target, candidate } = data;
    this.server.to(target).emit('ice-candidate', {
      candidate,
      sender: client.id,
    });
  }
}

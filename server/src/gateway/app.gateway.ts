import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(5002, {
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

  handleConnection(client: any, ...args: any[]) {
    this.logger.log(`User connected: ${client.id}`);

    this.server
      .to('user-joined')
      // .to(client.id)
      .emit('connection', 'Successfully connected to the server');
  }

  handleDisconnect(client: any) {
    this.logger.log(`User disconnected: ${client.id}`);
    this.server
      .to('user-left')
      .emit('disconnection', 'A user has disconnected');
  }
}

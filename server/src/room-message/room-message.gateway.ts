import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { RoomMessageService } from './room-message.service';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from 'src/guards/ws.auth.guard';
import { SendRoomMessageDto } from './validation';
import { RoomRedisService } from 'src/redis/room.redis';
import { WsUser } from 'src/utils/decorator/ws.decorator';
import { RoomService } from 'src/room/room.service';
import { JwtService } from '@nestjs/jwt';
import { RoomConnectionDto } from 'src/room/validation';

@UseGuards(WsAuthGuard)
@WebSocketGateway(5001, { cors: { origin: '*' } })
export class RoomMessageGateway {
  private readonly logger = new Logger(RoomMessageGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messageService: RoomMessageService,
    private readonly roomRedis: RoomRedisService,
    private readonly roomService: RoomService,
    private readonly jwtService: JwtService,
  ) {}

  @SubscribeMessage('room:send')
  async handleSendMessage(
    @MessageBody() data: SendRoomMessageDto,
    @ConnectedSocket() client: Socket,
    @WsUser() senderId: string,
  ) {
    const { roomId, content, mediaUrl, type, mediaType } = data;

    if (!senderId) {
      this.logger.error('No senderId found');
      client.emit('dm:error', { message: 'Not authenticated' });
      return;
    }
    this.logger.log(`Room ID: ${roomId}`);
    const room = await this.roomService.findById(roomId);
    if (!room) {
      client.emit('error', { message: 'Room not found' });
      return;
    }

    try {
      this.logger.log(`Checking if ${senderId} can send message to ${roomId}`);

      const canSendMessage = await this.roomService.canMessage(
        roomId,
        senderId,
      );

      this.logger.log(`Can send message: ${canSendMessage}`);

      if (!canSendMessage) {
        this.logger.warn(`User ${senderId} cannot send message to ${roomId}`);
        client.emit('dm:error', {
          message: 'Cannot send message to this user',
        });
        return;
      }

      this.logger.log(`Saving message to database...`);
      const savedMessage = await this.messageService.sendMessage(
        roomId,
        senderId,
        content,
        mediaUrl,
        type,
        mediaType,
      );

      const roomSocketId = await this.roomRedis.getUsersocketByRoomId(
        senderId,
        roomId,
      );

      if (!roomSocketId) {
        return client.emit('dm:error', {
          message: 'You are not connected to this room',
          receiverId: data.roomId,
          error: 'not_connected',
        });
      }

      // Send confirmation to sender
      client.emit('room:sent', savedMessage);

      this.server.to(roomSocketId).emit('room:new', savedMessage);
      this.logger.log(`Message delivered to room ${roomId}`);
    } catch (error) {
      this.logger.error('Error handling room message:', error);
      this.logger.error('Error stack:', error.stack);
      client.emit('dm:error', {
        message: 'Failed to send message',
        receiverId: data.roomId,
        error: error.message,
      });
    }
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @MessageBody() data: RoomConnectionDto,
    @ConnectedSocket() client: Socket,
    @WsUser() userId: string,
  ) {
    const { roomId } = data;
    // Pass client.id as socketId
    const result = await this.roomService.joinRoom(roomId, userId);

    await this.roomRedis.addUserToRoom(userId, roomId, client.id);

    client.join(data.roomId); // Join the socket.io room
    client.emit('room:userJoined', result);
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @MessageBody() data: RoomConnectionDto,
    @ConnectedSocket() client: Socket,
    @WsUser() userId: string,
  ) {
    const { roomId } = data;
    // Pass client.id as socketId
    const result = await this.roomService.leaveRoom(roomId, userId);

    await this.roomRedis.removeUserFromRoom(userId, roomId);

    client.join(data.roomId); // Join the socket.io room
    client.emit('room:userLeft', result);
  }
}

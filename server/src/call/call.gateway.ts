import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { CallService } from './call.service';
import { PrismaService } from '../prisma/prisma.service';
import { CallType } from './dto/start-call.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  currentRoom?: string;
}

interface MediaState {
  video: boolean;
  audio: boolean;
  screen: boolean;
}

interface CallParticipant {
  userId: string;
  socketId: string;
  mediaState: MediaState;
  joinedAt: Date;
}

@WebSocketGateway(5002, {
  namespace: '/call',
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class CallGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CallGateway.name);

  // Simplified: Just track who's in which room
  private rooms = new Map<string, Map<string, CallParticipant>>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly callService: CallService,
    private readonly prisma: PrismaService,
  ) {}

  // ===== CONNECTION HANDLERS =====
  async handleConnection(client: AuthenticatedSocket) {
    try {
      const userId = await this.authenticateUser(client);
      if (!userId) {
        client.emit('error', {
          code: 'AUTH_FAILED',
          message: 'Authentication failed',
        });
        client.disconnect();
        return;
      }

      client.userId = userId;
      client.emit('connected', { userId });
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.currentRoom && client.userId) {
      await this.handleLeaveCall(client, { roomId: client.currentRoom });
    }
  }

  private async authenticateUser(client: Socket): Promise<string | null> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) return null;

      const decoded = await this.jwtService.verifyAsync(token);
      return decoded.userId || decoded.sub;
    } catch (error) {
      return null;
    }
  }

  // ===== CALL MANAGEMENT =====
  @SubscribeMessage('join-call')
  async handleJoinCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; mediaState?: MediaState },
  ) {
    const {
      roomId,
      mediaState = { video: false, audio: true, screen: false },
    } = data;
    const userId = client.userId!;

    try {
      // Check room access
      const hasAccess = await this.verifyRoomAccess(roomId, userId);
      if (!hasAccess) {
        client.emit('error', {
          code: 'ACCESS_DENIED',
          message: 'No access to this room',
        });
        return;
      }

      // Leave current room if in one
      if (client.currentRoom && client.currentRoom !== roomId) {
        await this.handleLeaveCall(client, { roomId: client.currentRoom });
      }

      // Get or create room
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Map());
      }

      const room = this.rooms.get(roomId)!;

      // Check if already in room
      if (room.has(userId)) {
        client.emit('error', {
          code: 'ALREADY_IN_CALL',
          message: 'Already in this call',
        });
        return;
      }

      // Add participant
      const participant: CallParticipant = {
        userId,
        socketId: client.id,
        mediaState,
        joinedAt: new Date(),
      };

      room.set(userId, participant);
      client.currentRoom = roomId;
      client.join(roomId);

      // Get other participants
      const otherParticipants = Array.from(room.values())
        .filter((p) => p.userId !== userId)
        .map((p) => ({
          userId: p.userId,
          mediaState: p.mediaState,
        }));

      // Send response to joiner
      client.emit('call-joined', {
        roomId,
        participants: otherParticipants,
      });

      // Notify others
      client.to(roomId).emit('participant-joined', {
        userId,
        mediaState,
      });

      // Create call session record
      await this.callService.startCall(userId, {
        roomId,
        type: CallType.VIDEO,
      });
    } catch (error) {
      this.logger.error('Error joining call:', error);
      client.emit('error', {
        code: 'JOIN_FAILED',
        message: 'Failed to join call',
      });
    }
  }

  @SubscribeMessage('leave-call')
  async handleLeaveCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.userId!;

    const room = this.rooms.get(roomId);
    if (!room || !room.has(userId)) return;

    const participant = room.get(userId)!;
    const callDuration = Math.floor(
      (Date.now() - participant.joinedAt.getTime()) / 1000,
    );

    // Remove participant
    room.delete(userId);
    client.leave(roomId);
    client.currentRoom = undefined;

    // Notify others
    client.to(roomId).emit('participant-left', { userId });

    // Clean up empty room
    if (room.size === 0) {
      this.rooms.delete(roomId);
    }

    client.emit('call-left', { roomId });

    // Record call end
    try {
      await this.callService.endCall(userId, roomId, callDuration);
    } catch (error) {
      this.logger.error('Error recording call end:', error);
    }
  }

  // ===== SIGNALING (SIMPLIFIED) =====
  @SubscribeMessage('signal')
  handleSignal(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      roomId: string;
      targetUserId: string;
      type: 'offer' | 'answer' | 'ice-candidate';
      payload: any;
    },
  ) {
    const { roomId, targetUserId, type, payload } = data;
    const senderId = client.userId!;

    // Verify both users are in the same room
    const room = this.rooms.get(roomId);
    if (!room || !room.has(senderId) || !room.has(targetUserId)) {
      client.emit('error', {
        code: 'SIGNAL_FAILED',
        message: 'Invalid signal target',
      });
      return;
    }

    const targetParticipant = room.get(targetUserId)!;

    // Forward signal to target
    this.server.to(targetParticipant.socketId).emit('signal', {
      fromUserId: senderId,
      type,
      payload,
    });
  }

  // ===== MEDIA CONTROLS =====
  @SubscribeMessage('update-media')
  handleUpdateMedia(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; mediaState: Partial<MediaState> },
  ) {
    const { roomId, mediaState } = data;
    const userId = client.userId!;

    const room = this.rooms.get(roomId);
    if (!room || !room.has(userId)) return;

    // Update participant's media state
    const participant = room.get(userId)!;
    participant.mediaState = { ...participant.mediaState, ...mediaState };

    // Notify others
    client.to(roomId).emit('media-updated', {
      userId,
      mediaState: participant.mediaState,
    });
  }

  // ===== UTILITY METHODS =====
  private async verifyRoomAccess(
    roomId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const room = await this.prisma.room.findFirst({
        where: {
          id: roomId,
          OR: [
            { participants: { some: { id: userId } } },
            { creatorId: userId },
          ],
        },
      });
      return !!room;
    } catch (error) {
      this.logger.error('Error verifying room access:', error);
      return false;
    }
  }

  // ===== ADMIN/MONITORING =====
  getActiveRooms() {
    return Array.from(this.rooms.entries()).map(([roomId, participants]) => ({
      roomId,
      participantCount: participants.size,
      participants: Array.from(participants.values()).map((p) => ({
        userId: p.userId,
        mediaState: p.mediaState,
        joinedAt: p.joinedAt,
      })),
    }));
  }
}

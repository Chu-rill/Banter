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
  username: string;
  socketId: string;
  mediaState: MediaState;
  joinedAt: Date;
}

@WebSocketGateway({
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

  // Track user socket connections for notifications (userId -> Set of socketIds)
  private userConnections = new Map<string, Set<string>>();

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

      // Track this socket connection for the user
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(client.id);

      client.emit('connected', { userId });
      this.logger.log(`✅ User ${userId} connected with socket ${client.id}`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.currentRoom && client.userId) {
      await this.handleLeaveCall(client, { roomId: client.currentRoom });
    }

    // Remove socket from user connections
    if (client.userId) {
      const connections = this.userConnections.get(client.userId);
      if (connections) {
        connections.delete(client.id);
        if (connections.size === 0) {
          this.userConnections.delete(client.userId);
        }
      }
      this.logger.log(
        `❌ User ${client.userId} disconnected socket ${client.id}`,
      );
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
  @SubscribeMessage('initiate-call')
  async handleInitiateCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      roomId: string;
      isVideoCall: boolean;
      callerName: string;
      callerAvatar: string;
    },
  ) {
    const { roomId, isVideoCall, callerName, callerAvatar } = data;
    const callerId = client.userId!;

    this.logger.log(
      `📞 User ${callerId} initiating ${isVideoCall ? 'video' : 'voice'} call for room ${roomId}`,
    );

    try {
      // Verify caller has access
      const hasAccess = await this.verifyRoomAccess(roomId, callerId);
      if (!hasAccess) {
        this.logger.warn(`❌ Caller ${callerId} denied access to ${roomId}`);
        client.emit('error', {
          code: 'ACCESS_DENIED',
          message: 'No access to this room',
        });
        return;
      }

      // Get caller info
      const caller = await this.prisma.user.findUnique({
        where: { id: callerId },
        select: { username: true, avatar: true },
      });

      // Find recipients based on room type
      let recipientIds: string[] = [];

      // Check if it's an actual room
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        include: { participants: { select: { id: true } } },
      });

      if (room) {
        // Group call - notify all members except caller
        recipientIds = room.participants
          .map((p) => p.id)
          .filter((id) => id !== callerId);
      } else if (roomId.includes('-')) {
        // Friend call with combined ID (userId1-userId2)
        const [id1, id2] = roomId.split('-');
        const otherUserId = callerId === id1 ? id2 : id1;
        recipientIds = [otherUserId];
      } else {
        // Legacy: roomId is the friend's userId
        recipientIds = [roomId];
      }

      this.logger.log(`📢 Notifying ${recipientIds.length} recipient(s)`);

      // Send incoming-call event to all recipient connections
      for (const recipientId of recipientIds) {
        const recipientSockets = this.userConnections.get(recipientId);
        if (recipientSockets && recipientSockets.size > 0) {
          for (const socketId of recipientSockets) {
            this.server.to(socketId).emit('incoming-call', {
              callerId,
              callerName: caller?.username || 'Unknown',
              callerAvatar: caller?.avatar,
              roomId,
              isVideoCall,
            });
          }
          this.logger.log(
            `✅ Notified ${recipientId} on ${recipientSockets.size} device(s)`,
          );
        } else {
          this.logger.log(`⚠️ Recipient ${recipientId} not connected`);
        }
      }

      // Confirm to caller
      client.emit('call-initiated', {
        roomId,
        recipientCount: recipientIds.length,
      });
    } catch (error) {
      this.logger.error('Error initiating call:', error);
      client.emit('error', {
        code: 'INITIATE_FAILED',
        message: 'Failed to initiate call',
      });
    }
  }

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

    this.logger.log(
      `🔔 User ${userId} attempting to join call in room ${roomId}`,
    );

    try {
      // Check room access
      const hasAccess = await this.verifyRoomAccess(roomId, userId);
      if (!hasAccess) {
        this.logger.warn(
          `❌ Access denied for user ${userId} to room ${roomId}`,
        );
        client.emit('error', {
          code: 'ACCESS_DENIED',
          message: 'No access to this room',
        });
        return;
      }

      this.logger.log(`✅ Access granted for user ${userId} to room ${roomId}`);

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
        this.logger.warn(
          `⚠️ User ${userId} already in room ${roomId}, updating socket connection`,
        );
        // Update the socket ID for this user instead of rejecting
        const existingParticipant = room.get(userId)!;
        existingParticipant.socketId = client.id;
        client.currentRoom = roomId;
        client.join(roomId);

        // Send current participants to the reconnecting user
        const otherParticipants = Array.from(room.values())
          .filter((p) => p.userId !== userId)
          .map((p) => ({
            userId: p.userId,
            username: p.username,
            mediaState: p.mediaState,
          }));

        client.emit('call-joined', {
          roomId,
          participants: otherParticipants,
        });
        return;
      }

      // Fetch user info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      // Add participant
      const participant: CallParticipant = {
        userId,
        username: user?.username || 'Unknown',
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
          username: p.username,
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
        username: participant.username,
        mediaState,
      });

      // Create call session record only for actual rooms (not friend calls with combined IDs)
      // Friend calls use format: userId1-userId2, which don't have Room records in DB
      const isActualRoom = !roomId.includes('-');
      if (isActualRoom) {
        await this.callService.startCall(userId, {
          roomId,
          type: CallType.VIDEO,
        });
      }
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

    // Record call end only for actual rooms (not friend calls with combined IDs)
    const isActualRoom = !roomId.includes('-');
    if (isActualRoom) {
      try {
        await this.callService.endCall(userId, roomId, callDuration);
      } catch (error) {
        this.logger.error('Error recording call end:', error);
      }
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
      this.logger.log(
        `🔍 Verifying room access for userId: ${userId}, roomId: ${roomId}`,
      );

      // First check if it's an actual room
      const room = await this.prisma.room.findFirst({
        where: {
          id: roomId,
          OR: [
            { participants: { some: { id: userId } } },
            { creatorId: userId },
          ],
        },
      });

      if (room) {
        this.logger.log(`✅ Found actual room: ${room.id}`);
        return true;
      }

      // Check if roomId is a combined ID for friend calls (format: userId1-userId2)
      if (roomId.includes('-')) {
        this.logger.log(
          `🔍 Checking friend call with combined roomId: ${roomId}`,
        );
        const [id1, id2] = roomId.split('-');
        this.logger.log(`Split IDs: ${id1}, ${id2}`);

        // Verify userId is one of the two IDs
        if (userId !== id1 && userId !== id2) {
          this.logger.warn(
            `❌ User ${userId} not part of combined room ID ${roomId}`,
          );
          return false;
        }

        // Get the other user's ID
        const otherUserId = userId === id1 ? id2 : id1;
        this.logger.log(`Other user ID: ${otherUserId}`);

        // Check if they are friends
        const friendship = await this.prisma.friendship.findFirst({
          where: {
            OR: [
              {
                requesterId: userId,
                receiverId: otherUserId,
                status: 'ACCEPTED',
              },
              {
                requesterId: otherUserId,
                receiverId: userId,
                status: 'ACCEPTED',
              },
            ],
          },
        });

        this.logger.log(
          `Friend call verification for ${userId} and ${otherUserId}: ${!!friendship}`,
        );

        return !!friendship;
      }

      // If not a room and not a combined ID, check if roomId is a friend's userId (legacy)
      const friendship = await this.prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: userId, receiverId: roomId, status: 'ACCEPTED' },
            { requesterId: roomId, receiverId: userId, status: 'ACCEPTED' },
          ],
        },
      });

      this.logger.log(
        `Legacy friend check for userId ${userId} and roomId ${roomId}: ${!!friendship}`,
      );

      return !!friendship;
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

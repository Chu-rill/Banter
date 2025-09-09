import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { CallService } from './call.service';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface CallParticipant {
  userId: string;
  socketId: string;
  peerId?: string;
  isHost: boolean;
  mediaState: {
    video: boolean;
    audio: boolean;
    screen: boolean;
  };
}

interface CallRoom {
  roomId: string;
  participants: Map<string, CallParticipant>;
  isActive: boolean;
  createdAt: Date;
  type: 'video' | 'audio' | 'screen';
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
  private callRooms = new Map<string, CallRoom>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly callService: CallService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const userId = await this.authenticateUser(client);
      if (!userId) {
        this.logger.warn(`Authentication failed for client ${client.id}`);
        client.disconnect();
        return;
      }

      client.userId = userId;
      this.logger.log(`User ${userId} connected to call namespace`);
      
      client.emit('connected', { 
        message: 'Connected to call server',
        userId 
      });
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;
    if (userId) {
      // Leave all call rooms the user was in
      for (const [roomId, callRoom] of this.callRooms.entries()) {
        if (callRoom.participants.has(userId)) {
          await this.leaveCallRoom(client, { roomId });
        }
      }
      this.logger.log(`User ${userId} disconnected from call namespace`);
    }
  }

  private async authenticateUser(client: Socket): Promise<string | null> {
    try {
      const token = 
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        const decoded = await this.jwtService.verifyAsync(token);
        return decoded.userId;
      }

      return null;
    } catch (error) {
      this.logger.error('Authentication error:', error);
      return null;
    }
  }

  @SubscribeMessage('join-call')
  async handleJoinCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { 
      roomId: string; 
      mediaState: { video: boolean; audio: boolean; screen: boolean } 
    },
  ) {
    const { roomId, mediaState } = data;
    const userId = client.userId!;

    try {
      // Verify user has access to the room
      const room = await this.prisma.room.findFirst({
        where: {
          id: roomId,
          OR: [
            { participants: { some: { id: userId } } },
            { creatorId: userId },
          ],
        },
      });

      if (!room) {
        client.emit('error', { message: 'Room not found or access denied' });
        return;
      }

      // Create call room if it doesn't exist
      if (!this.callRooms.has(roomId)) {
        this.callRooms.set(roomId, {
          roomId,
          participants: new Map(),
          isActive: true,
          createdAt: new Date(),
          type: 'video',
        });
      }

      const callRoom = this.callRooms.get(roomId)!;
      
      // Add participant to call room
      const participant: CallParticipant = {
        userId,
        socketId: client.id,
        isHost: callRoom.participants.size === 0,
        mediaState,
      };

      callRoom.participants.set(userId, participant);
      client.join(roomId);

      // Notify other participants
      client.to(roomId).emit('user-joined', {
        userId,
        mediaState,
        isHost: participant.isHost,
        participantCount: callRoom.participants.size,
      });

      // Send current participants to the new user
      const currentParticipants = Array.from(callRoom.participants.values())
        .filter(p => p.userId !== userId)
        .map(p => ({
          userId: p.userId,
          mediaState: p.mediaState,
          isHost: p.isHost,
        }));

      client.emit('call-joined', {
        roomId,
        participants: currentParticipants,
        isHost: participant.isHost,
      });

      this.logger.log(`User ${userId} joined call room ${roomId}`);
    } catch (error) {
      this.logger.error('Error joining call:', error);
      client.emit('error', { message: 'Failed to join call' });
    }
  }

  @SubscribeMessage('leave-call')
  async leaveCallRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.userId!;

    const callRoom = this.callRooms.get(roomId);
    if (!callRoom || !callRoom.participants.has(userId)) {
      return;
    }

    // Remove participant
    callRoom.participants.delete(userId);
    client.leave(roomId);

    // Notify other participants
    client.to(roomId).emit('user-left', {
      userId,
      participantCount: callRoom.participants.size,
    });

    // Clean up empty call room
    if (callRoom.participants.size === 0) {
      this.callRooms.delete(roomId);
      this.logger.log(`Call room ${roomId} cleaned up`);
    }

    client.emit('call-left', { roomId });
    this.logger.log(`User ${userId} left call room ${roomId}`);
  }

  @SubscribeMessage('webrtc-offer')
  handleWebRTCOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { 
      roomId: string; 
      targetUserId: string; 
      offer: RTCSessionDescriptionInit;
    },
  ) {
    const { roomId, targetUserId, offer } = data;
    const callerId = client.userId!;

    const callRoom = this.callRooms.get(roomId);
    if (!callRoom) return;

    const targetParticipant = callRoom.participants.get(targetUserId);
    if (!targetParticipant) return;

    // Forward offer to target user
    this.server.to(targetParticipant.socketId).emit('webrtc-offer', {
      roomId,
      callerId,
      offer,
    });

    this.logger.log(`WebRTC offer sent from ${callerId} to ${targetUserId} in room ${roomId}`);
  }

  @SubscribeMessage('webrtc-answer')
  handleWebRTCAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { 
      roomId: string; 
      callerId: string; 
      answer: RTCSessionDescriptionInit;
    },
  ) {
    const { roomId, callerId, answer } = data;
    const answererId = client.userId!;

    const callRoom = this.callRooms.get(roomId);
    if (!callRoom) return;

    const callerParticipant = callRoom.participants.get(callerId);
    if (!callerParticipant) return;

    // Forward answer to caller
    this.server.to(callerParticipant.socketId).emit('webrtc-answer', {
      roomId,
      answererId,
      answer,
    });

    this.logger.log(`WebRTC answer sent from ${answererId} to ${callerId} in room ${roomId}`);
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleWebRTCIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { 
      roomId: string; 
      targetUserId: string; 
      candidate: RTCIceCandidateInit;
    },
  ) {
    const { roomId, targetUserId, candidate } = data;
    const senderId = client.userId!;

    const callRoom = this.callRooms.get(roomId);
    if (!callRoom) return;

    const targetParticipant = callRoom.participants.get(targetUserId);
    if (!targetParticipant) return;

    // Forward ICE candidate to target user
    this.server.to(targetParticipant.socketId).emit('webrtc-ice-candidate', {
      roomId,
      senderId,
      candidate,
    });
  }

  @SubscribeMessage('media-state-change')
  handleMediaStateChange(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { 
      roomId: string; 
      mediaState: { video: boolean; audio: boolean; screen: boolean };
    },
  ) {
    const { roomId, mediaState } = data;
    const userId = client.userId!;

    const callRoom = this.callRooms.get(roomId);
    if (!callRoom || !callRoom.participants.has(userId)) return;

    // Update participant's media state
    const participant = callRoom.participants.get(userId)!;
    participant.mediaState = mediaState;

    // Notify other participants
    client.to(roomId).emit('media-state-changed', {
      userId,
      mediaState,
    });

    this.logger.log(`Media state changed for user ${userId} in room ${roomId}`);
  }

  @SubscribeMessage('start-screen-share')
  handleStartScreenShare(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.userId!;

    client.to(roomId).emit('screen-share-started', { userId });
    this.logger.log(`Screen share started by user ${userId} in room ${roomId}`);
  }

  @SubscribeMessage('stop-screen-share')
  handleStopScreenShare(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.userId!;

    client.to(roomId).emit('screen-share-stopped', { userId });
    this.logger.log(`Screen share stopped by user ${userId} in room ${roomId}`);
  }

  @SubscribeMessage('call-end')
  handleCallEnd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { roomId } = data;
    const userId = client.userId!;

    const callRoom = this.callRooms.get(roomId);
    if (!callRoom || !callRoom.participants.has(userId)) return;

    const participant = callRoom.participants.get(userId)!;
    
    // Only host can end the call for everyone
    if (participant.isHost) {
      // Notify all participants that call is ending
      this.server.to(roomId).emit('call-ended', { 
        endedBy: userId,
        reason: 'ended_by_host' 
      });

      // Clean up the call room
      this.callRooms.delete(roomId);
      this.logger.log(`Call ended by host ${userId} in room ${roomId}`);
    }
  }

  // Get active call rooms (for admin/monitoring)
  getActiveCallRooms() {
    return Array.from(this.callRooms.entries()).map(([roomId, callRoom]) => ({
      roomId,
      participantCount: callRoom.participants.size,
      isActive: callRoom.isActive,
      createdAt: callRoom.createdAt,
      type: callRoom.type,
    }));
  }
}

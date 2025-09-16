import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CallRepository } from './call.repository';
import { StartCallDto } from './dto/start-call.dto';

// Define proper ICE server types
interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

@Injectable()
export class CallService {
  constructor(private readonly callRepository: CallRepository) {}

  async startCall(userId: string, startCallDto: StartCallDto) {
    const { roomId, type } = startCallDto;

    // Verify user has access to the room
    const room = await this.callRepository.findRoomWithAccess(roomId, userId);

    if (!room) {
      throw new NotFoundException('Room not found or access denied');
    }

    // Create call session record
    const callSession = await this.callRepository.createCallSession(
      roomId,
      userId,
    );

    return {
      callSession,
      room: {
        id: room.id,
        name: room.name,
        participants: room.participants,
      },
      stunServers: this.getSTUNServers(),
    };
  }

  async endCall(userId: string, callSessionId: string, duration: number) {
    const callSession =
      await this.callRepository.findCallSessionById(callSessionId);

    if (!callSession || callSession.userId !== userId) {
      throw new NotFoundException('Call session not found');
    }

    // Update call session with duration
    return await this.callRepository.updateCallSessionDuration(
      callSessionId,
      duration,
    );
  }

  async getCallHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [calls, total] = await Promise.all([
      this.callRepository.findUserCallHistory(userId, skip, limit),
      this.callRepository.countUserCallHistory(userId),
    ]);

    return {
      calls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRoomCallHistory(userId: string, roomId: string) {
    // Verify user has access to the room
    const room = await this.callRepository.findRoomWithAccess(roomId, userId);

    if (!room) {
      throw new ForbiddenException('Access denied to room');
    }

    return await this.callRepository.findRoomCallHistory(roomId);
  }

  async getCallStats(userId: string) {
    const stats = await this.callRepository.aggregateUserCallStats(userId);

    const totalDuration = stats._sum.duration || 0;
    const totalCalls = stats._count.id || 0;
    const avgDuration = stats._avg.duration || 0;

    // Get call activity by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCalls = await this.callRepository.findRecentUserCalls(
      userId,
      thirtyDaysAgo,
    );

    return {
      totalDuration,
      totalCalls,
      avgDuration: Math.round(avgDuration),
      recentActivity: this.groupCallsByDay(recentCalls),
    };
  }

  private getSTUNServers(): RTCIceServer[] {
    const stunServers = process.env.STUN_SERVERS?.split(',') || [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
    ];

    const servers: RTCIceServer[] = stunServers.map((url) => ({ urls: url }));

    // Add TURN server if configured
    if (process.env.TURN_SERVER_URL) {
      servers.push({
        urls: process.env.TURN_SERVER_URL,
        username: process.env.TURN_SERVER_USERNAME,
        credential: process.env.TURN_SERVER_CREDENTIAL,
      });
    }

    return servers;
  }

  private groupCallsByDay(calls: { createdAt: Date; duration: number }[]) {
    const grouped: Record<string, { count: number; totalDuration: number }> =
      {};

    calls.forEach((call) => {
      const date = call.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { count: 0, totalDuration: 0 };
      }
      grouped[date].count += 1;
      grouped[date].totalDuration += call.duration;
    });

    return Object.entries(grouped).map(([date, data]) => ({
      date,
      count: data.count,
      totalDuration: data.totalDuration,
      avgDuration: Math.round(data.totalDuration / data.count),
    }));
  }

  // Admin methods
  async getActiveCallRooms() {
    // This would be implemented by the gateway
    return [];
  }

  async getAllCallStats() {
    const stats = await this.callRepository.aggregateAllCallStats();

    return {
      totalCalls: stats._count.id || 0,
      totalDuration: stats._sum.duration || 0,
      avgDuration: Math.round(stats._avg.duration || 0),
    };
  }
}

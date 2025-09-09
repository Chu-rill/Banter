import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCallDto } from './dto/create-call.dto';
import { UpdateCallDto } from './dto/update-call.dto';
import { StartCallDto } from './dto/start-call.dto';

@Injectable()
export class CallService {
  constructor(private readonly prisma: PrismaService) {}

  async startCall(userId: string, startCallDto: StartCallDto) {
    const { roomId, type } = startCallDto;

    // Verify user has access to the room
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        OR: [
          { participants: { some: { id: userId } } },
          { creatorId: userId },
        ],
      },
      include: {
        participants: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found or access denied');
    }

    // Create call session record
    const callSession = await this.prisma.callSession.create({
      data: {
        roomId,
        userId,
        duration: 0, // Will be updated when call ends
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        room: {
          select: { id: true, name: true, type: true },
        },
      },
    });

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
    const callSession = await this.prisma.callSession.findUnique({
      where: { id: callSessionId },
    });

    if (!callSession || callSession.userId !== userId) {
      throw new NotFoundException('Call session not found');
    }

    // Update call session with duration
    return await this.prisma.callSession.update({
      where: { id: callSessionId },
      data: { duration },
    });
  }

  async getCallHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [calls, total] = await Promise.all([
      this.prisma.callSession.findMany({
        where: { userId },
        include: {
          room: {
            select: { id: true, name: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.callSession.count({
        where: { userId },
      }),
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
      throw new ForbiddenException('Access denied to room');
    }

    return await this.prisma.callSession.findMany({
      where: { roomId },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCallStats(userId: string) {
    const stats = await this.prisma.callSession.aggregate({
      where: { userId },
      _sum: { duration: true },
      _count: { id: true },
      _avg: { duration: true },
    });

    const totalDuration = stats._sum.duration || 0;
    const totalCalls = stats._count.id || 0;
    const avgDuration = stats._avg.duration || 0;

    // Get call activity by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCalls = await this.prisma.callSession.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        duration: true,
      },
    });

    return {
      totalDuration,
      totalCalls,
      avgDuration: Math.round(avgDuration),
      recentActivity: this.groupCallsByDay(recentCalls),
    };
  }

  private getSTUNServers() {
    const stunServers = process.env.STUN_SERVERS?.split(',') || [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
    ];

    const servers = stunServers.map(url => ({ urls: url }));

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
    const grouped = {};
    
    calls.forEach(call => {
      const date = call.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { count: 0, totalDuration: 0 };
      }
      grouped[date].count += 1;
      grouped[date].totalDuration += call.duration;
    });

    return Object.entries(grouped).map(([date, data]: [string, any]) => ({
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
    const stats = await this.prisma.callSession.aggregate({
      _sum: { duration: true },
      _count: { id: true },
      _avg: { duration: true },
    });

    return {
      totalCalls: stats._count.id || 0,
      totalDuration: stats._sum.duration || 0,
      avgDuration: Math.round(stats._avg.duration || 0),
    };
  }
}

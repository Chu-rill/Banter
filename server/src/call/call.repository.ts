import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CallRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRoomWithAccess(roomId: string, userId: string) {
    return await this.prisma.room.findFirst({
      where: {
        id: roomId,
        OR: [{ participants: { some: { id: userId } } }, { creatorId: userId }],
      },
      include: {
        participants: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });
  }

  async createCallSession(roomId: string, userId: string) {
    return await this.prisma.callSession.create({
      data: {
        roomId,
        userId,
        duration: 0,
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
  }

  async findCallSessionById(callSessionId: string) {
    return await this.prisma.callSession.findUnique({
      where: { id: callSessionId },
    });
  }

  async updateCallSessionDuration(callSessionId: string, duration: number) {
    return await this.prisma.callSession.update({
      where: { id: callSessionId },
      data: { duration },
    });
  }

  async findUserCallHistory(userId: string, skip: number, take: number) {
    return await this.prisma.callSession.findMany({
      where: { userId },
      include: {
        room: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async countUserCallHistory(userId: string) {
    return await this.prisma.callSession.count({
      where: { userId },
    });
  }

  async findRoomCallHistory(roomId: string) {
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

  async aggregateUserCallStats(userId: string) {
    return await this.prisma.callSession.aggregate({
      where: { userId },
      _sum: { duration: true },
      _count: { id: true },
      _avg: { duration: true },
    });
  }

  async findRecentUserCalls(userId: string, fromDate: Date) {
    return await this.prisma.callSession.findMany({
      where: {
        userId,
        createdAt: { gte: fromDate },
      },
      select: {
        createdAt: true,
        duration: true,
      },
    });
  }

  async aggregateAllCallStats() {
    return await this.prisma.callSession.aggregate({
      _sum: { duration: true },
      _count: { id: true },
      _avg: { duration: true },
    });
  }
}

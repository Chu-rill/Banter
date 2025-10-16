import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CallRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRoomWithAccess(roomId: string, userId: string) {
    // First try to find an actual room
    const room = await this.prisma.room.findFirst({
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

    if (room) {
      return room;
    }

    // Handle friend calls with combined ID format (userId1-userId2)
    if (roomId.includes('-')) {
      const [id1, id2] = roomId.split('-');

      // Verify userId is one of the two IDs
      if (userId !== id1 && userId !== id2) {
        return null;
      }

      // Get the other user's ID
      const otherUserId = userId === id1 ? id2 : id1;

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

      if (!friendship) {
        return null;
      }

      // Fetch both users' info
      const [user1, user2] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: id1 },
          select: { id: true, username: true, avatar: true },
        }),
        this.prisma.user.findUnique({
          where: { id: id2 },
          select: { id: true, username: true, avatar: true },
        }),
      ]);

      // Return a virtual room object for friend calls
      return {
        id: roomId,
        name: `${user1?.username || 'User'} & ${user2?.username || 'User'}`,
        participants: [user1, user2].filter(Boolean),
      } as any;
    }

    // Handle legacy friend calls where roomId is the friend's userId
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: roomId, status: 'ACCEPTED' },
          { requesterId: roomId, receiverId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!friendship) {
      return null;
    }

    // Fetch both users' info
    const [currentUser, friendUser] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, avatar: true },
      }),
      this.prisma.user.findUnique({
        where: { id: roomId },
        select: { id: true, username: true, avatar: true },
      }),
    ]);

    // Return a virtual room object for legacy friend calls
    return {
      id: roomId,
      name: `${currentUser?.username || 'User'} & ${friendUser?.username || 'User'}`,
      participants: [currentUser, friendUser].filter(Boolean),
    } as any;
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

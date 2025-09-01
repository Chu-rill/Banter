import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomType, RoomMode } from '../../generated/prisma';

@Injectable()
export class RoomRepository {
  constructor(private prisma: PrismaService) {}

  async createRoom(
    name: string,
    description: string,
    type: RoomType,
    maxParticipants: number,
    creatorId: string,
    mode: RoomMode,
    price?: number,
    isPaid?: boolean,
  ) {
    return this.prisma.room.create({
      data: {
        name,
        description,
        type,
        creatorId,
        maxParticipants,
        mode,
        price,
        isPaid,
        participants: {
          connect: { id: creatorId },
        },
      },
      include: {
        participants: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        creator: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
    });
  }

  async getAllRooms(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        skip,
        take: limit,
        include: {
          participants: {
            select: { id: true, username: true, email: true, avatar: true },
          },
          creator: {
            select: { id: true, username: true, email: true, avatar: true },
          },
        },
      }),
      this.prisma.room.count(),
    ]);

    return { rooms, total };
  }

  async getRoomById(id: string) {
    return this.prisma.room.findUnique({
      where: { id },
      include: {
        participants: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        creator: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        messages: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
        callSessions: true,
      },
    });
  }

  async joinRoom(roomId: string, userId: string) {
    return this.prisma.room.update({
      where: { id: roomId },
      data: { participants: { connect: { id: userId } } },
      include: {
        participants: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
    });
  }

  async leaveRoom(roomId: string, userId: string) {
    return this.prisma.room.update({
      where: { id: roomId },
      data: { participants: { disconnect: { id: userId } } },
      include: {
        participants: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
    });
  }

  // Check if a user is a member of a room
  async isRoomMember(roomId: string, userId: string): Promise<boolean> {
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        participants: {
          some: { id: userId },
        },
      },
      select: { id: true },
    });
    return !!room;
  }
}

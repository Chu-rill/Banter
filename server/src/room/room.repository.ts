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

  async updateRoom(id: string, updateData: any) {
    return this.prisma.room.update({
      where: { id },
      data: updateData,
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
        callSessions: true,
      },
    });
  }

  async getMessagesByRoomId(roomId: string) {
    return this.prisma.message.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
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

  async removeMember(roomId: string, userId: string) {
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

  async deleteRoom(id: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      select: { creator: true },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.creator.id !== userId) {
      throw new Error('Only the room creator can delete this room');
    }
    return this.prisma.room.delete({
      where: { id },
    });
  }

  // Room Join Request Methods
  async createJoinRequest(roomId: string, userId: string) {
    return this.prisma.roomJoinRequest.create({
      data: {
        roomId,
        userId,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
    });
  }

  async getJoinRequest(roomId: string, userId: string) {
    return this.prisma.roomJoinRequest.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });
  }

  async getJoinRequestById(id: string) {
    return this.prisma.roomJoinRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        room: {
          select: { id: true, name: true, creatorId: true },
        },
      },
    });
  }

  async getPendingJoinRequests(roomId: string) {
    console.log('fetching for roomId:', roomId);
    return this.prisma.roomJoinRequest.findMany({
      where: {
        roomId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async updateJoinRequestStatus(id: string, status: 'APPROVED' | 'DENIED') {
    return this.prisma.roomJoinRequest.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
    });
  }

  async deleteJoinRequest(id: string) {
    return this.prisma.roomJoinRequest.delete({
      where: { id },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendStatus } from '../../generated/prisma';

@Injectable()
export class FriendshipRepository {
  constructor(private prisma: PrismaService) {}

  async sendFriendRequest(requesterId: string, receiverId: string) {
    const user = await this.prisma.friendship.create({
      data: { requesterId, receiverId },
    });

    return user;
  }

  async respondToRequest(friendshipId: string, status: FriendStatus) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new Error(`Friendship with id ${friendshipId} not found`);
    }

    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status },
    });
  }

  async getFriendshipsByStatus(userId: string, status: FriendStatus) {
    return this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: status },
          { receiverId: userId, status: status },
        ],
      },
      include: {
        requester: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        // receiver: {
        //   select: { id: true, username: true, email: true, avatar: true },
        // },
      },
    });
  }

  async existing(requesterId: string, receiverId: string) {
    let exist = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    });
    return exist;
  }
}

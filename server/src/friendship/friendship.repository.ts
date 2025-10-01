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

  async getById(id: string) {
    return await this.prisma.friendship.findUnique({
      where: { id },
    });
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
        status,
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
      include: {
        requester: true,
        receiver: true,
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

  // Check if two users are friends (accepted friendship)
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          {
            requesterId: userId1,
            receiverId: userId2,
            status: FriendStatus.ACCEPTED,
          },
          {
            requesterId: userId2,
            receiverId: userId1,
            status: FriendStatus.ACCEPTED,
          },
        ],
      },
    });

    return !!friendship;
  }

  // Get the friendship record between two users (regardless of status)
  async getFriendship(userId1: string, userId2: string) {
    return this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId1, receiverId: userId2 },
          { requesterId: userId2, receiverId: userId1 },
        ],
      },
      include: {
        requester: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        receiver: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
    });
  }

  // Get friendship status between two users
  async getFriendshipStatus(
    userId1: string,
    userId2: string,
  ): Promise<FriendStatus | null> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId1, receiverId: userId2 },
          { requesterId: userId2, receiverId: userId1 },
        ],
      },
      select: { status: true },
    });

    return friendship?.status || null;
  }

  // Get all friends of a user (accepted friendships only)
  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: FriendStatus.ACCEPTED },
          { receiverId: userId, status: FriendStatus.ACCEPTED },
        ],
      },
      include: {
        requester: {
          select: { id: true, username: true, email: true, avatar: true },
        },
        receiver: {
          select: { id: true, username: true, email: true, avatar: true },
        },
      },
    });

    // Return the friend (not the current user) from each friendship
    return friendships.map((friendship) => {
      return friendship.requesterId === userId
        ? friendship.receiver
        : friendship.requester;
    });
  }

  // Get friend count for a user
  async getFriendCount(userId: string): Promise<number> {
    return this.prisma.friendship.count({
      where: {
        OR: [
          { requesterId: userId, status: FriendStatus.ACCEPTED },
          { receiverId: userId, status: FriendStatus.ACCEPTED },
        ],
      },
    });
  }

  // Get mutual friends between two users
  async getMutualFriends(userId1: string, userId2: string) {
    // Get all friends of user1
    const user1Friends = await this.getFriends(userId1);
    const user1FriendIds = user1Friends.map((friend) => friend.id);

    // Get all friends of user2
    const user2Friends = await this.getFriends(userId2);
    const user2FriendIds = user2Friends.map((friend) => friend.id);

    // Find intersection (mutual friends)
    const mutualFriendIds = user1FriendIds.filter((id) =>
      user2FriendIds.includes(id),
    );

    // Return full user objects for mutual friends
    return user1Friends.filter((friend) => mutualFriendIds.includes(friend.id));
  }

  // Remove/delete friendship
  async removeFriendship(userId1: string, userId2: string) {
    const friendship = await this.getFriendship(userId1, userId2);

    if (!friendship) {
      throw new Error('Friendship not found');
    }

    return this.prisma.friendship.delete({
      where: { id: friendship.id },
    });
  }

  // Block a user (update status to BLOCKED)
  async blockUser(blockerId: string, blockedId: string) {
    const existing = await this.existing(blockerId, blockedId);

    if (existing) {
      // Update existing friendship to BLOCKED
      return this.prisma.friendship.update({
        where: { id: existing.id },
        data: { status: FriendStatus.BLOCKED },
      });
    } else {
      // Create new blocked friendship
      return this.prisma.friendship.create({
        data: {
          requesterId: blockerId,
          receiverId: blockedId,
          status: FriendStatus.BLOCKED,
        },
      });
    }
  }

  // Check if user is blocked
  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          {
            requesterId: userId1,
            receiverId: userId2,
            status: FriendStatus.BLOCKED,
          },
          {
            requesterId: userId2,
            receiverId: userId1,
            status: FriendStatus.BLOCKED,
          },
        ],
      },
    });

    return !!friendship;
  }
}

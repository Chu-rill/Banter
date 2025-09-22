import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageType, MediaType, Prisma } from '../../generated/prisma';

@Injectable()
export class RoomMessageRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new message in a room
   */
  async createMessage(
    roomId: string,
    userId: string,
    content?: string,
    type: MessageType = MessageType.TEXT,
    mediaUrl?: string,
    mediaType?: MediaType,
  ) {
    return await this.prisma.message.create({
      data: {
        roomId,
        userId,
        content,
        type,
        mediaUrl,
        mediaType,
        // Automatically mark the message as read by the sender
        readBy: {
          create: {
            userId,
          },
        },
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        readBy: {
          select: {
            userId: true,
            user: {
              select: { id: true, username: true, avatar: true },
            },
            readAt: true,
          },
        },
      },
    });
  }

  /**
   * Get messages with read status for a specific user
   */
  async getMessages(
    roomId: string,
    userId: string,
    limit = 50,
    cursor?: string,
  ) {
    const messages = await this.prisma.message.findMany({
      where: { roomId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        readBy: {
          select: {
            userId: true,
            user: {
              select: { id: true, username: true, avatar: true },
            },
            readAt: true,
          },
        },
      },
    });

    // Add a computed field to indicate if the current user has read each message
    return messages.map((message) => ({
      ...message,
      isReadByCurrentUser: message.readBy.some(
        (read) => read.userId === userId,
      ),
      readByCount: message.readBy.length,
    }));
  }

  /**
   * Mark messages as read up to a specific message
   */
  async markMessagesAsRead(
    roomId: string,
    userId: string,
    lastMessageId: string,
  ) {
    // Get the timestamp of the last message
    const lastMessage = await this.prisma.message.findUnique({
      where: { id: lastMessageId },
      select: { createdAt: true, roomId: true },
    });

    if (!lastMessage || lastMessage.roomId !== roomId) {
      throw new Error('Message not found or does not belong to this room');
    }

    // Get all unread messages up to this point
    const unreadMessages = await this.prisma.message.findMany({
      where: {
        roomId,
        createdAt: {
          lte: lastMessage.createdAt,
        },
        NOT: {
          readBy: {
            some: {
              userId,
            },
          },
        },
      },
      select: { id: true },
    });

    // Batch create read receipts
    if (unreadMessages.length > 0) {
      await this.prisma.messageRead.createMany({
        data: unreadMessages.map((msg) => ({
          messageId: msg.id,
          userId,
        })),
        skipDuplicates: true, // In case of race conditions
      });
    }

    return {
      markedCount: unreadMessages.length,
      lastReadMessageId: lastMessageId,
    };
  }

  /**
   * Mark a single message as read by a user
   */
  async markMessageAsRead(messageId: string, userId: string) {
    return this.prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      create: {
        messageId,
        userId,
      },
      update: {
        readAt: new Date(), // Update read timestamp if re-reading
      },
      include: {
        message: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
      },
    });
  }

  /**
   * Get unread message count for a user in a room
   */
  async getUnreadCount(roomId: string, userId: string) {
    return this.prisma.message.count({
      where: {
        roomId,
        // Don't count user's own messages
        userId: {
          not: userId,
        },
        // Messages not read by this user
        NOT: {
          readBy: {
            some: {
              userId,
            },
          },
        },
      },
    });
  }

  /**
   * Get the last message read by a user in a room
   */
  async getLastReadMessage(roomId: string, userId: string) {
    const lastRead = await this.prisma.messageRead.findFirst({
      where: {
        userId,
        message: {
          roomId,
        },
      },
      orderBy: {
        message: {
          createdAt: 'desc',
        },
      },
      include: {
        message: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
      },
    });

    return lastRead?.message || null;
  }

  /**
   * Get unread messages for a user in a room
   */
  async getUnreadMessages(roomId: string, userId: string, limit = 50) {
    return this.prisma.message.findMany({
      where: {
        roomId,
        // Don't return user's own messages
        userId: {
          not: userId,
        },
        // Messages not read by this user
        NOT: {
          readBy: {
            some: {
              userId,
            },
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        readBy: {
          select: {
            userId: true,
            user: {
              select: { id: true, username: true },
            },
            readAt: true,
          },
        },
      },
    });
  }

  /**
   * Get read receipts for a specific message
   */
  async getMessageReadReceipts(messageId: string) {
    return this.prisma.messageRead.findMany({
      where: { messageId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isOnline: true,
            lastSeen: true,
          },
        },
      },
      orderBy: { readAt: 'asc' },
    });
  }

  /**
   * Get all users who have read messages up to a certain point in a room
   */
  async getUsersReadStatus(roomId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { createdAt: true, roomId: true },
    });

    if (!message || message.roomId !== roomId) {
      throw new Error('Message not found or does not belong to this room');
    }

    // Get all room participants
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    // For each participant, find their last read message
    const readStatuses = await Promise.all(
      room.participants.map(async (participant) => {
        const lastRead = await this.prisma.messageRead.findFirst({
          where: {
            userId: participant.id,
            message: {
              roomId,
              createdAt: {
                lte: message.createdAt,
              },
            },
          },
          orderBy: {
            message: {
              createdAt: 'desc',
            },
          },
          include: {
            message: {
              select: { id: true, createdAt: true },
            },
          },
        });

        return {
          user: participant,
          lastReadMessageId: lastRead?.messageId || null,
          lastReadAt: lastRead?.readAt || null,
          hasReadUpToMessage:
            !!lastRead && lastRead.message.createdAt >= message.createdAt,
        };
      }),
    );

    return readStatuses;
  }

  /**
   * Mark all messages in a room as read for a user
   */
  async markAllRoomMessagesAsRead(roomId: string, userId: string) {
    // Get all unread messages in the room
    const unreadMessages = await this.prisma.message.findMany({
      where: {
        roomId,
        NOT: {
          readBy: {
            some: {
              userId,
            },
          },
        },
      },
      select: { id: true },
    });

    if (unreadMessages.length === 0) {
      return { markedCount: 0 };
    }

    // Batch create read receipts
    await this.prisma.messageRead.createMany({
      data: unreadMessages.map((msg) => ({
        messageId: msg.id,
        userId,
      })),
      skipDuplicates: true,
    });

    return { markedCount: unreadMessages.length };
  }

  /**
   * Get rooms with unread messages for a user
   */
  async getRoomsWithUnreadMessages(userId: string) {
    // Get all rooms the user is a participant of
    const userRooms = await this.prisma.room.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
      select: { id: true, name: true },
    });

    // For each room, check if there are unread messages
    const roomsWithUnread = await Promise.all(
      userRooms.map(async (room) => {
        const unreadCount = await this.getUnreadCount(room.id, userId);
        const lastMessage = await this.prisma.message.findFirst({
          where: { roomId: room.id },
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        });

        return {
          ...room,
          unreadCount,
          lastMessage,
          hasUnread: unreadCount > 0,
        };
      }),
    );

    return roomsWithUnread.filter((room) => room.hasUnread);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageType, MediaType } from '../../generated/prisma';

@Injectable()
export class RoomMessageRepository {
  constructor(private prisma: PrismaService) {}

  async createMessage(
    roomId: string,
    userId: string,
    content?: string,
    type: MessageType = MessageType.TEXT,
    mediaUrl?: string,
    mediaType?: MediaType,
  ) {
    return this.prisma.message.create({
      data: { roomId, userId, content, type, mediaUrl, mediaType },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });
  }

  async getMessages(roomId: string, limit = 50, cursor?: string) {
    return this.prisma.message.findMany({
      where: { roomId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });
  }

  /**
   * Mark all messages in a room as read for a specific user
   * This marks all messages in the room that were sent before or at the specified message
   */
  async markMessagesAsRead(
    roomId: string,
    userId: string,
    lastMessageId: string,
  ) {
    // First get the timestamp of the last message to mark everything before it as read
    const lastMessage = await this.prisma.message.findUnique({
      where: { id: lastMessageId },
      select: { createdAt: true },
    });

    if (!lastMessage) {
      throw new Error('Message not found');
    }

    // Mark all messages in the room created before or at this timestamp as read
    // Note: In a real app, you might want to track read status per user
    // This would require a separate MessageRead table
    return this.prisma.message.updateMany({
      where: {
        roomId,
        createdAt: {
          lte: lastMessage.createdAt,
        },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  /**
   * Mark a single message as read
   */
  async markMessageAsRead(messageId: string) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  /**
   * Get unread message count for a room
   */
  async getUnreadCount(roomId: string, userId: string) {
    return this.prisma.message.count({
      where: {
        roomId,
        isRead: false,
        // Don't count user's own messages as unread
        userId: {
          not: userId,
        },
      },
    });
  }

  /**
   * Get the last read message for a user in a room
   * This would be more accurate with a MessageRead tracking table
   */
  async getLastReadMessage(roomId: string, userId: string) {
    return this.prisma.message.findFirst({
      where: {
        roomId,
        isRead: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });
  }

  /**
   * Mark all messages before a certain date as read
   */
  async markMessagesAsReadBefore(roomId: string, beforeDate: Date) {
    return this.prisma.message.updateMany({
      where: {
        roomId,
        createdAt: {
          lt: beforeDate,
        },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  /**
   * Get unread messages for a user in a room
   */
  async getUnreadMessages(roomId: string, userId: string, limit = 50) {
    return this.prisma.message.findMany({
      where: {
        roomId,
        isRead: false,
        // Don't return user's own messages
        userId: {
          not: userId,
        },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
    });
  }
}

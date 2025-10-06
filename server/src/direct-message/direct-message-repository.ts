import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageType, MediaType } from '../../generated/prisma';

@Injectable()
export class DirectMessageRepository {
  constructor(private prisma: PrismaService) {}

  async sendMessage(
    senderId: string,
    receiverId: string,
    content?: string,
    type: MessageType = MessageType.TEXT,
    mediaType?: MediaType,
    mediaUrl?: string,
  ) {
    return this.prisma.directMessage.create({
      data: { senderId, receiverId, content, type, mediaUrl, mediaType },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
        receiver: { select: { id: true, username: true, avatar: true } },
      },
    });
  }

  async getConversation(userId: string, friendId: string, limit = 50) {
    return this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
        receiver: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { MessageType, MediaType } from '../../generated/prisma';
import { RoomMessageRepository } from './room-message.repository';
import { time } from 'console';

@Injectable()
export class RoomMessageService {
  constructor(private readonly roomMessageRepository: RoomMessageRepository) {}

  async sendMessage(
    roomId: string,
    userId: string,
    content?: string,
    type?,
    mediaUrl?,
    mediaType?,
  ) {
    // Business rules example: prevent empty messages unless media
    if (!content && !mediaUrl) {
      throw new Error('Message must have content or media');
    }

    return await this.roomMessageRepository.createMessage(
      roomId,
      userId,
      content,
      type,
      mediaUrl,
      mediaType,
    );
  }

  async getRoomMessages(
    roomId: string,
    userId: string,
    limit = 50,
    cursor?: string,
  ) {
    return await this.roomMessageRepository.getMessages(
      roomId,
      userId,
      limit,
      cursor,
    );
  }

  async sendSystemMessage(roomId: string, content: string, userId: string) {
    let data = await this.roomMessageRepository.createMessage(
      roomId,
      userId,
      content,
      MessageType.SYSTEM,
    );

    return {
      id: data.id,
      room: data.roomId,
      user: data.user.username,
      content: data.content,
      timestamp: data.createdAt,
    };
  }

  async markMessagesRead(
    roomId: string,
    userId: string,
    lastMessageId: string,
  ) {
    const data = await this.roomMessageRepository.markMessagesAsRead(
      roomId,
      userId,
      lastMessageId,
    );
    return data;
  }
}

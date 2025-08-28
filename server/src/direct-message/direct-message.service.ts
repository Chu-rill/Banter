import { Injectable } from '@nestjs/common';
import { DirectMessageRepository } from './direct-message-repository';

@Injectable()
export class DirectMessageService {
  constructor(private readonly repo: DirectMessageRepository) {}

  async sendDirectMessage(
    senderId: string,
    receiverId: string,
    content?: string,
    mediaUrl?,
    type?,
    mediaType?,
  ) {
    // business logic: check if they are friends before sending
    // (optional: inject FriendshipService to validate friendship)
    return this.repo.sendMessage(
      senderId,
      receiverId,
      content,
      type,
      mediaType,
      mediaUrl,
    );
  }

  async getChat(userId: string, friendId: string, limit = 50) {
    return this.repo.getConversation(userId, friendId, limit);
  }
}

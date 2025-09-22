import { z } from 'zod';
import { MediaType, MessageType } from '@generated/prisma';

export const MessageTypeEnum = z.nativeEnum(MessageType);
export const MediaTypeEnum = z.nativeEnum(MediaType);

// Zod Schemas

export const SendRoomMessageSchema = z.object({
  roomId: z.string().cuid(),
  content: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  type: MessageTypeEnum.default(MessageType.TEXT),
  mediaType: MediaTypeEnum.optional(),
});

export const GetDirectMessagesWithUserSchema = z.object({
  userId: z.string().cuid(),
});

// DTO Types

export type SendRoomMessageDto = z.infer<typeof SendRoomMessageSchema>;
export type GetDirectMessagesWithUserDto = z.infer<
  typeof GetDirectMessagesWithUserSchema
>;

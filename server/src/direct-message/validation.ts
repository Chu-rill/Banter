import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { MediaType, MessageType } from '@generated/prisma';

export const MessageTypeEnum = z.nativeEnum(MessageType);
export const MediaTypeEnum = z.nativeEnum(MediaType);

// Zod Schemas

export const SendDirectMessageSchema = z.object({
  receiverId: z.string().cuid(),
  content: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  type: MessageTypeEnum.default(MessageType.TEXT),
  mediaType: MediaTypeEnum.optional(),
});

export const GetDirectMessagesWithUserSchema = z.object({
  userId: z.string().cuid(),
});

// DTO Types

export type SendDirectMessageDto = z.infer<typeof SendDirectMessageSchema>;
export type GetDirectMessagesWithUserDto = z.infer<
  typeof GetDirectMessagesWithUserSchema
>;

// Swagger DTOs

export class SendDirectMessageDtoSwagger {
  @ApiProperty({
    example: 'cl9v1z5t30000qzrmn1g6v6y',
    description: 'Recipient user ID',
  })
  recipientId: string;

  @ApiProperty({
    example: 'Hello there!',
    description: 'Message content',
  })
  content: string;
}

export class GetDirectMessagesWithUserDtoSwagger {
  @ApiProperty({
    example: 'cl9v1z5t30000qzrmn1g6v6y',
    description: 'Other user ID to fetch messages with',
  })
  userId: string;
}

import { FriendStatus } from '@generated/prisma';
import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const StatusEnum = z.nativeEnum(FriendStatus);

export const UpdateStatusSchema = z.object({
  requesterId: z.string().cuid(),
  status: StatusEnum,
});

export type UpdateStatusDto = z.infer<typeof UpdateStatusSchema>;

export class UpdateFriendStatusDtoSwagger {
  @ApiProperty({
    example: 'cl9v1z5t30000qzrmn1g6v6y',
    description: 'ID of the user who sent the friend request',
  })
  requesterId: string;

  @ApiProperty({
    example: 'ACCEPTED',
    description: 'New status of the friendship (ACCEPTED, DECLINED, BLOCKED)',
  })
  status: typeof StatusEnum;
}

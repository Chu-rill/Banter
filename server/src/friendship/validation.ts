import { FriendStatus } from '@generated/prisma';
import { z } from 'zod';

export const StatusEnum = z.nativeEnum(FriendStatus);

export const UpdateStatusSchema = z.object({
  requesterId: z.string().cuid(),
  status: StatusEnum,
});

export type UpdateStatusDto = z.infer<typeof UpdateStatusSchema>;

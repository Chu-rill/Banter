import { z } from 'zod';
import { RoomType, RoomMode, Room } from '@generated/prisma';
import { ApiProperty } from '@nestjs/swagger';

//Types for Room model
export const RoleTypeEnum = z.nativeEnum(RoomType);
const RoleModeEnum = z.nativeEnum(RoomMode);

//Zod Schemas
export const CreateRoomSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  type: RoleTypeEnum,
  maxParticipants: z.number().int().min(2),
  mode: RoleModeEnum,
  price: z.number().min(0).optional(),
  isPaid: z.boolean().optional(),
});

export const GetRoomSchema = z.object({
  id: z.string().cuid(),
});

export const GetAllRoomsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const RoomConnectionSchema = z.object({
  roomId: z.string().cuid(),
  userId: z.string().cuid(),
});

//Type inference from Zod schemas
// export type Room = z.infer<typeof RoomSchema>;
export type CreateRoomDto = z.infer<typeof CreateRoomSchema>;
export type GetAllRoomsQueryDto = z.infer<typeof GetAllRoomsQuerySchema>;
export type GetRoomDto = z.infer<typeof GetRoomSchema>;
export type RoomConnectionDto = z.infer<typeof RoomConnectionSchema>;

//Swagger DTO classes for documentation
export class CreateRoomDtoSwagger {
  @ApiProperty({
    example: 'NestJs Developers',
    description: 'Group name',
  })
  name: string;

  @ApiProperty({
    example: 'Group for NestJs developers',
    description: 'Group description',
  })
  description: string;

  @ApiProperty({
    example: 'PUBLIC',
    description: 'what type of group it is',
  })
  type: typeof RoleTypeEnum;

  @ApiProperty({
    example: 50,
    description: 'Number of maximum participants allowed ',
  })
  maxParticipants: number;

  @ApiProperty({
    example: 'CHAT',
    description: 'The mode of the room "chat, live-stream, etc" ',
  })
  mode: typeof RoleModeEnum;

  @ApiProperty({
    example: 100,
    description: 'The price to join the room, if it is a paid room',
    required: false,
    default: 0,
  })
  price: number;

  @ApiProperty({
    example: false,
    description: 'Is the room paid or free',
    required: false,
  })
  isPaid: boolean;
}

export class GetAllRoomsQueryDtoSwagger {
  @ApiProperty({
    example: 1,
    description: 'Page number for pagination',
    required: false,
    default: 1,
  })
  page?: number;

  @ApiProperty({
    example: 10,
    description: 'Number of rooms per page for pagination',
    required: false,
    default: 10,
  })
  limit?: number;
}

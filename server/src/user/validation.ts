// validation.ts - Add query validation schemas
import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Zod Schemas

export const UserSchema = z.object({
  id: z.string().cuid(),
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  avatar: z.string().nullable().optional(),
  bio: z.string().max(200).nullable().optional(),
  isOnline: z.boolean().optional(),
  lastSeen: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CreateUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
  avatar: z.string().nullable().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const UpdateUserSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  avatar: z.string().nullable().optional(),
  bio: z.string().max(200).nullable().optional(),
});

// Query validation schema
export const GetUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isOnline: z.coerce.boolean().optional(),
  sortBy: z.enum(['username', 'email', 'createdAt', 'lastSeen']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

//type inference from Zod schemas

export type User = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type GetUsersQueryDto = z.infer<typeof GetUsersQuerySchema>;

// Swagger DTOs
export class CreateUserDtoSwagger {
  @ApiProperty({ example: 'johndoe', description: 'Username of the user' })
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  email: string;

  @ApiProperty({
    example: 'StrongPass123',
    description:
      'Password (must contain at least one uppercase letter, one lowercase letter, and one digit)',
  })
  password: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.png',
    description: 'Optional avatar URL',
  })
  avatar?: string | null;
}

export class UpdateUserDtoSwagger {
  @ApiPropertyOptional({ example: 'newname', description: 'Updated username' })
  username?: string;

  @ApiPropertyOptional({
    example: 'newmail@example.com',
    description: 'Updated email address',
  })
  email?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/new-avatar.png',
    description: 'Updated avatar URL',
  })
  avatar?: string | null;

  @ApiPropertyOptional({
    example: 'Software developer who loves coding',
    description: 'User bio (max 200 characters)',
  })
  bio?: string | null;
}

export class GetUsersQueryDtoSwagger {
  @ApiPropertyOptional({ example: 1, description: 'Page number (min: 1)' })
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of users per page (max: 100)',
  })
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'john',
    description: 'Search term (username or email)',
  })
  search?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by online status',
  })
  isOnline?: boolean;

  @ApiPropertyOptional({
    example: 'username',
    enum: ['username', 'email', 'createdAt', 'lastSeen'],
    description: 'Field to sort users by',
  })
  sortBy?: 'username' | 'email' | 'createdAt' | 'lastSeen';

  @ApiPropertyOptional({
    example: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  sortOrder: 'asc' | 'desc' = 'desc';
}

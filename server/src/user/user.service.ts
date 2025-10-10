import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './validation';
import { UserRepository } from './user.repository';
import { SupabaseService } from 'src/file/file.service';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private readonly supabaseService: SupabaseService,
  ) {}

  async getUserById(id: string) {
    const user = await this.userRepository.getUserById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  async getUserByEmail(email: string) {
    const user = await this.userRepository.getUserByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  async getUserByUsername(username: string) {
    const user = await this.userRepository.getUserByUsername(username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  async searchUsersByUsername(username: string) {
    const users = await this.userRepository.searchUsersByUsername(username);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Users retrieved successfully',
      data: users,
    };
  }

  async updateUser(id: string, updateData: UpdateUserDto) {
    try {
      const user = await this.userRepository.updateUser(id, updateData);

      return {
        statusCode: HttpStatus.OK,
        success: true,
        message: 'Profile updated successfully',
        data: user,
      };
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    // Step 1: upload file to Supabase
    const fileUrl = await this.supabaseService.uploadAvatar(file, 'uploads');
    const avatarUrl = fileUrl;

    // Step 2: update user record in DB
    const user = await this.userRepository.updateAvatar(userId, avatarUrl);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Avatar updated successfully',
      data: user,
    };
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    // Ensure safe defaults
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const { users, total } = await this.userRepository.getAllUsers(
      pageNum,
      limitNum,
    );

    const totalPages = Math.ceil(total / limit);

    return {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };
  }

  async updateOnlineStatus(id: string, isOnline: boolean) {
    return this.userRepository.updateUser(id, { isOnline });
  }
}

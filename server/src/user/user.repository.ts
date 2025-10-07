import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './validation';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async createUser(username: string, email: string, password: string) {
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });
    return user;
  }

  async createUserOauth(username: string, email: string, picture: string) {
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        avatar: picture,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        password: true,
        avatar: true,
        isOnline: true,
        isVerified: true,
      },
    });
    return user;
  }

  async markUserAsVerified(id: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          isVerified: true,
          actionToken: null,
          actionTokenExpiry: null,
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          isOnline: true,
          isVerified: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async updateUserPassword(id: string, hashedPassword: string) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          actionToken: null,
          actionTokenExpiry: null,
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          isOnline: true,
          isVerified: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async findByActionToken(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { actionToken: token },
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true,
        actionToken: true,
        actionTokenExpiry: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateActionToken(
    userId: string,
    token: string,
    expiry: Date,
  ): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          actionToken: token,
          actionTokenExpiry: expiry,
        },
      });
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        isOnline: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        avatar: true,
        isOnline: true,
        isVerified: true,
      },
    });
    return user;
  }

  async getUserByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
      },
    });
    return user;
  }

  async updateUser(id: string, updateData: any) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          isOnline: true,
          lastSeen: true,
          updatedAt: true,
        },
      });

      return user;
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async getAllUsers(page: number = 1, limit: number) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          isOnline: true,
          lastSeen: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return { users, total };
  }

  // Refresh Token Methods
  async createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async findRefreshToken(token: string) {
    return await this.prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async revokeRefreshToken(token: string) {
    return await this.prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    return await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async cleanupExpiredRefreshTokens() {
    return await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

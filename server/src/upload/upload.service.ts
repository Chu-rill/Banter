import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadFile(file: UploadedFile, userId: string, roomId?: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
    if (file.size > maxSize) {
      await this.deleteFile(file.path);
      throw new BadRequestException(`File too large. Maximum size is ${maxSize} bytes`);
    }

    // Determine media type
    const mediaType = this.getMediaType(file.mimetype);

    // Generate secure filename
    const fileExtension = path.extname(file.originalname);
    const secureFilename = crypto.randomUUID() + fileExtension;
    const securePath = path.join(file.destination, secureFilename);

    // Rename file to secure name
    await fs.promises.rename(file.path, securePath);

    // Create file URL
    const fileUrl = `/uploads/${secureFilename}`;

    // Save file metadata to database
    const uploadRecord = await this.prisma.message.create({
      data: {
        roomId: roomId!,
        userId,
        type: 'MEDIA',
        content: file.originalname, // Store original filename as content
        mediaUrl: fileUrl,
        mediaType,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return {
      id: uploadRecord.id,
      filename: secureFilename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: fileUrl,
      mediaType,
      uploadedAt: uploadRecord.createdAt,
      user: uploadRecord.user,
    };
  }

  async uploadAvatar(file: UploadedFile, userId: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate it's an image
    if (!file.mimetype.startsWith('image/')) {
      await this.deleteFile(file.path);
      throw new BadRequestException('Avatar must be an image file');
    }

    // Validate file size (2MB for avatars)
    const maxAvatarSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxAvatarSize) {
      await this.deleteFile(file.path);
      throw new BadRequestException('Avatar file too large. Maximum size is 2MB');
    }

    // Generate secure filename
    const fileExtension = path.extname(file.originalname);
    const secureFilename = `avatar-${userId}-${Date.now()}${fileExtension}`;
    const securePath = path.join(file.destination, secureFilename);

    // Rename file to secure name
    await fs.promises.rename(file.path, securePath);

    // Create file URL
    const avatarUrl = `/uploads/${secureFilename}`;

    // Get user's current avatar to delete it later
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Update user's avatar in database
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    // Delete old avatar file if it exists
    if (user?.avatar && user.avatar.startsWith('/uploads/')) {
      const oldAvatarPath = path.join(
        process.env.UPLOAD_DEST || './uploads',
        path.basename(user.avatar)
      );
      try {
        await this.deleteFile(oldAvatarPath);
      } catch (error) {
        // Ignore errors when deleting old avatar
        console.warn('Failed to delete old avatar:', error.message);
      }
    }

    return {
      url: avatarUrl,
      filename: secureFilename,
      uploadedAt: new Date(),
    };
  }

  async getFile(filename: string) {
    const filePath = path.join(process.env.UPLOAD_DEST || './uploads', filename);
    
    try {
      await fs.promises.access(filePath);
      return filePath;
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }

  async deleteFile(filePath: string) {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      // File doesn't exist or couldn't be deleted
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async deleteUpload(uploadId: string, userId: string) {
    const upload = await this.prisma.message.findFirst({
      where: {
        id: uploadId,
        userId,
        type: 'MEDIA',
      },
    });

    if (!upload) {
      throw new NotFoundException('Upload not found or access denied');
    }

    // Delete file from disk
    if (upload.mediaUrl) {
      const filename = path.basename(upload.mediaUrl);
      const filePath = path.join(process.env.UPLOAD_DEST || './uploads', filename);
      try {
        await this.deleteFile(filePath);
      } catch (error) {
        console.warn('Failed to delete file from disk:', error.message);
      }
    }

    // Delete record from database
    await this.prisma.message.delete({
      where: { id: uploadId },
    });

    return { message: 'Upload deleted successfully' };
  }

  async getUserUploads(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [uploads, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          userId,
          type: 'MEDIA',
        },
        select: {
          id: true,
          content: true,
          mediaUrl: true,
          mediaType: true,
          createdAt: true,
          room: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          userId,
          type: 'MEDIA',
        },
      }),
    ]);

    return {
      uploads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUploadStats(userId: string) {
    const stats = await this.prisma.message.groupBy({
      by: ['mediaType'],
      where: {
        userId,
        type: 'MEDIA',
      },
      _count: { id: true },
    });

    const totalUploads = await this.prisma.message.count({
      where: {
        userId,
        type: 'MEDIA',
      },
    });

    return {
      totalUploads,
      byType: stats.reduce((acc, stat) => {
        if (stat.mediaType) {
          acc[stat.mediaType] = stat._count.id;
        }
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private getMediaType(mimetype: string): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' {
    if (mimetype.startsWith('image/')) return 'IMAGE';
    if (mimetype.startsWith('video/')) return 'VIDEO';
    if (mimetype.startsWith('audio/')) return 'AUDIO';
    return 'FILE';
  }

  // Generate thumbnail for images and videos
  async generateThumbnail(filePath: string, mediaType: string): Promise<string | null> {
    // This would integrate with image processing libraries like Sharp or FFmpeg
    // For now, return null - can be implemented later
    return null;
  }

  // Validate file integrity
  async validateFile(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.size > 0;
    } catch {
      return false;
    }
  }

  // Get file metadata
  async getFileMetadata(filePath: string) {
    try {
      const stats = await fs.promises.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }
}

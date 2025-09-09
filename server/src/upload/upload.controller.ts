import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Request,
  Response,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import { UploadService } from './upload.service';
import * as path from 'path';
import * as mime from 'mime-types';

@ApiTags('Upload')
@Controller('upload')
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @ApiOperation({ summary: 'Upload a file for sharing in chat' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or upload failed' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    @Query('roomId') roomId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return await this.uploadService.uploadFile(file, userId, roomId);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid image or upload failed' })
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const userId = req.user?.userId;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    return await this.uploadService.uploadAvatar(file, userId);
  }

  @Get('files/:filename')
  @ApiOperation({ summary: 'Serve uploaded files' })
  @ApiResponse({ status: 200, description: 'File served successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async serveFile(
    @Param('filename') filename: string,
    @Response() res: ExpressResponse,
  ) {
    try {
      const filePath = await this.uploadService.getFile(filename);
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      res.status(404).json({ message: 'File not found' });
    }
  }

  @Get('my-uploads')
  @ApiOperation({ summary: 'Get current user\'s uploaded files' })
  @ApiResponse({ status: 200, description: 'Uploads retrieved successfully' })
  async getMyUploads(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.userId;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return await this.uploadService.getUserUploads(userId, pageNum, limitNum);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get upload statistics for current user' })
  @ApiResponse({ status: 200, description: 'Upload stats retrieved successfully' })
  async getUploadStats(@Request() req: any) {
    const userId = req.user?.userId;
    return await this.uploadService.getUploadStats(userId);
  }

  @Delete(':uploadId')
  @ApiOperation({ summary: 'Delete an uploaded file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'Upload not found or access denied' })
  async deleteUpload(
    @Param('uploadId') uploadId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.userId;
    return await this.uploadService.deleteUpload(uploadId, userId);
  }

  @Get('metadata/:filename')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiResponse({ status: 200, description: 'Metadata retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFileMetadata(@Param('filename') filename: string) {
    const filePath = await this.uploadService.getFile(filename);
    return await this.uploadService.getFileMetadata(filePath);
  }

  @Post('validate/:filename')
  @ApiOperation({ summary: 'Validate file integrity' })
  @ApiResponse({ status: 200, description: 'File validation result' })
  async validateFile(@Param('filename') filename: string) {
    const filePath = await this.uploadService.getFile(filename);
    const isValid = await this.uploadService.validateFile(filePath);
    
    return {
      filename,
      isValid,
      message: isValid ? 'File is valid' : 'File is corrupted or empty',
    };
  }
}

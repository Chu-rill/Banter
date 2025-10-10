// file.controller.ts
import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from './file.service';
import { JwtAuthGuard } from 'src/guards/auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('images'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const url = await this.supabaseService.uploadImages(file, 'uploads');
    return {
      url,
      type: file.mimetype, // Return MIME type (e.g., "image/png", "video/mp4")
      name: file.originalname,
      size: file.size,
    };
  }
}

// supabase.service.ts
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { console } from 'inspector';

@Injectable()
export class SupabaseService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // service key (not public anon key)
    );
  }

  // supabase.service.ts
  async uploadImages(
    file: Express.Multer.File,
    bucket = 'uploads',
  ): Promise<string> {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.originalname.split('.').pop();
    const baseFilename = file.originalname.replace(/\.[^/.]+$/, ''); // Remove extension
    const filePath = `images/${timestamp}-${randomString}-${baseFilename}.${fileExtension}`;

    console.log('Uploading file to Supabase:', filePath);
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false, // Don't overwrite - create new version
      });

    if (error) throw error;

    const { data: publicUrl } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  }

  async uploadAvatar(
    file: Express.Multer.File,
    bucket = 'uploads',
  ): Promise<string> {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.originalname.split('.').pop();
    const baseFilename = file.originalname.replace(/\.[^/.]+$/, ''); // Remove extension
    const filePath = `avatars/${timestamp}-${randomString}-${baseFilename}.${fileExtension}`;

    console.log('Uploading file to Supabase:', filePath);
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false, // Don't overwrite - create new version
      });

    if (error) throw error;

    const { data: publicUrl } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  }
}

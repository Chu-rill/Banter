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
    const filePath = `images/${Date.now()}-${file.originalname}`;
    console.log('Uploading file to Supabase:', filePath);
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
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
    const filePath = `avatars/${Date.now()}-${file.originalname}`;
    console.log('Uploading file to Supabase:', filePath);
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrl } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  }
}

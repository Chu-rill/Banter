// supabase.service.ts
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.DATABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // service key (not public anon key)
    );
  }

  // supabase.service.ts
  async uploadFile(
    file: Express.Multer.File,
    bucket = 'uploads',
  ): Promise<string> {
    const filePath = `avatars/${Date.now()}-${file.originalname}`;

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

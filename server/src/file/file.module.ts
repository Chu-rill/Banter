import { Module } from '@nestjs/common';
import { SupabaseService } from './file.service';
import { FileController } from './file.controller';

@Module({
  controllers: [FileController],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class FileModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminMediaController } from './admin-media.controller';
import { ImageProcessorService } from './image-processor.service';
import { MediaService } from './media.service';
import { StorageService } from './storage.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminMediaController],
  providers: [MediaService, StorageService, ImageProcessorService],
  exports: [MediaService, StorageService],
})
export class MediaModule {}

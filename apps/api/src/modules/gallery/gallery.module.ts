import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { AdminGalleryController } from './admin-gallery.controller';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [GalleryController, AdminGalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}

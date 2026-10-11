import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { SiteProfileController } from './site-profile.controller';
import { SiteProfileService } from './site-profile.service';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [SiteProfileController],
  providers: [SiteProfileService],
})
export class SiteProfileModule {}

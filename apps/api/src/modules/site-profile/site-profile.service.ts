import { Injectable } from '@nestjs/common';
import type { SiteProfile as SiteProfileDto } from '@ds/contracts';
import type { MediaAsset, SiteProfile } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MediaService } from '../media/media.service';
import type { UpdateSiteProfileDto } from './dto/site-profile.dto';

const PROFILE_ID = 1;

/** Fallback before the profile is first saved: only facts confirmed from the brand's Instagram. */
export const DEFAULT_PROFILE = {
  displayName: 'December Scribbles',
  tagline: 'Life is nothing without inspirations. And i write what inspires.',
  aboutBody: '',
  contactEmail: null,
  instagramUrl: 'https://www.instagram.com/decemberscribbles/',
} as const;

@Injectable()
export class SiteProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async get(): Promise<SiteProfileDto> {
    const row = await this.prisma.siteProfile.findUnique({
      where: { id: PROFILE_ID },
      include: { aboutImage: true },
    });
    return row
      ? this.toDto(row)
      : { ...DEFAULT_PROFILE, aboutImage: null, updatedAt: new Date(0).toISOString() };
  }

  async update(dto: UpdateSiteProfileDto): Promise<SiteProfileDto> {
    if (dto.aboutImageId) await this.media.assertExists(dto.aboutImageId);
    const data = {
      displayName: dto.displayName,
      tagline: dto.tagline,
      aboutBody: dto.aboutBody,
      contactEmail: dto.contactEmail ?? null,
      instagramUrl: dto.instagramUrl ?? null,
      aboutImageId: dto.aboutImageId ?? null,
    };
    const row = await this.prisma.siteProfile.upsert({
      where: { id: PROFILE_ID },
      create: { id: PROFILE_ID, ...data },
      update: data,
      include: { aboutImage: true },
    });
    return this.toDto(row);
  }

  private toDto(row: SiteProfile & { aboutImage: MediaAsset | null }): SiteProfileDto {
    return {
      displayName: row.displayName,
      tagline: row.tagline,
      aboutBody: row.aboutBody,
      contactEmail: row.contactEmail,
      instagramUrl: row.instagramUrl,
      aboutImage: row.aboutImage ? this.media.toImageRef(row.aboutImage) : null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

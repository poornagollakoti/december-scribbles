import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { ImageRef, MediaAsset as MediaAssetDto, Paginated } from '@ds/contracts';
import type { MediaAsset } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { paginate, PaginationQueryDto, skipTake } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import { ImageProcessorService } from './image-processor.service';
import { StorageService } from './storage.service';

/** Relations that count as "in use" (an image in use cannot be deleted). */
const USAGE = { contentCovers: true, galleryItems: true, profileImages: true } as const;

function usage(count: Record<keyof typeof USAGE, number>): number {
  return count.contentCovers + count.galleryItems + count.profileImages;
}

export interface UploadedImage {
  buffer: Buffer;
  originalname: string;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly images: ImageProcessorService,
  ) {}

  /** Public image reference for embedding in content and gallery responses. */
  toImageRef(asset: MediaAsset, alt?: string): ImageRef {
    return {
      id: asset.id,
      url: this.storage.publicUrl(asset.storageKey),
      thumbnailUrl: this.storage.publicUrl(asset.thumbnailKey),
      width: asset.width,
      height: asset.height,
      alt: alt ?? asset.altText,
    };
  }

  async upload(
    file: UploadedImage | undefined,
    altText: string,
    uploadedById: string,
  ): Promise<MediaAssetDto> {
    if (!file?.buffer?.length) throw new BadRequestException('An image file is required');

    const processed = await this.images.process(file.buffer);
    const id = randomUUID();
    const storageKey = `media/${id}/full.webp`;
    const thumbnailKey = `media/${id}/thumb.webp`;

    await this.storage.put(storageKey, processed.full.data, 'image/webp');
    await this.storage.put(thumbnailKey, processed.thumb.data, 'image/webp');

    try {
      const asset = await this.prisma.mediaAsset.create({
        data: {
          id,
          storageKey,
          thumbnailKey,
          originalName: sanitiseFileName(file.originalname),
          mimeType: 'image/webp',
          sizeBytes: processed.full.data.length,
          width: processed.full.width,
          height: processed.full.height,
          altText,
          uploadedById,
        },
      });
      return this.toDto(asset, 0);
    } catch (error) {
      await this.storage.delete([storageKey, thumbnailKey]).catch(() => undefined);
      throw error;
    }
  }

  async list(query: PaginationQueryDto): Promise<Paginated<MediaAssetDto>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.mediaAsset.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: USAGE } },
        ...skipTake(query),
      }),
      this.prisma.mediaAsset.count(),
    ]);
    return paginate(
      rows.map((r) => this.toDto(r, usage(r._count))),
      total,
      query,
    );
  }

  async updateAltText(id: string, altText: string): Promise<MediaAssetDto> {
    await this.findOrThrow(id);
    const asset = await this.prisma.mediaAsset.update({
      where: { id },
      data: { altText },
      include: { _count: { select: USAGE } },
    });
    return this.toDto(asset, usage(asset._count));
  }

  async remove(id: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
      include: { _count: { select: USAGE } },
    });
    if (!asset) throw new NotFoundException('Media not found');
    if (usage(asset._count) > 0) {
      throw new ConflictException(
        'This image is in use (writing, gallery or the About section). Remove it there first.',
      );
    }
    await this.prisma.mediaAsset.delete({ where: { id } });
    // Database is the source of truth; an orphaned object is harmless, so storage errors are logged only.
    await this.storage
      .delete([asset.storageKey, asset.thumbnailKey])
      .catch((err: unknown) =>
        this.logger.warn({ err, mediaId: id }, 'Failed to delete media objects from storage'),
      );
  }

  /** Throws a 400 if the referenced media does not exist (used when linking images). */
  async assertExists(id: string): Promise<void> {
    const count = await this.prisma.mediaAsset.count({ where: { id } });
    if (!count) throw new BadRequestException(`Image ${id} does not exist`);
  }

  private async findOrThrow(id: string): Promise<MediaAsset> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Media not found');
    return asset;
  }

  private toDto(asset: MediaAsset, usageCount: number): MediaAssetDto {
    return {
      ...this.toImageRef(asset),
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      originalName: asset.originalName,
      usageCount,
      createdAt: asset.createdAt.toISOString(),
    };
  }
}

/** Keeps the original name for display only; strips paths and control characters. */
function sanitiseFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'image';
  // eslint-disable-next-line no-control-regex
  return base.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 200) || 'image';
}

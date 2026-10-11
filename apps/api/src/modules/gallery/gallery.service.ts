import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AdminGalleryItem,
  AdminGalleryListResponse,
  GalleryItem as GalleryItemDto,
  GalleryListResponse,
} from '@ds/contracts';
import type { GalleryItem, MediaAsset, Prisma } from '@prisma/client';
import { paginate, skipTake } from '../../common/dto/pagination.dto';
import { slugify, uniqueSlug } from '../../common/utils/slug';
import { PrismaService } from '../../database/prisma.service';
import { MediaService } from '../media/media.service';
import type {
  AdminGalleryListQueryDto,
  CreateGalleryItemDto,
  GalleryListQueryDto,
  UpdateGalleryItemDto,
} from './dto/gallery.dto';

type GalleryWithImage = GalleryItem & { image: MediaAsset };

const ORDER: Prisma.GalleryItemOrderByWithRelationInput[] = [
  { displayOrder: 'asc' },
  { createdAt: 'desc' },
];

/** Illustrations, posters and artwork. */
@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  // ---- Public --------------------------------------------------------------

  async listPublished(query: GalleryListQueryDto): Promise<GalleryListResponse> {
    const where: Prisma.GalleryItemWhereInput = {
      isPublished: true,
      ...(query.category && { category: query.category }),
    };
    const [rows, total, categories] = await this.prisma.$transaction([
      this.prisma.galleryItem.findMany({
        where,
        include: { image: true },
        orderBy: ORDER,
        ...skipTake(query),
      }),
      this.prisma.galleryItem.count({ where }),
      this.prisma.galleryItem.findMany({
        where: { isPublished: true, category: { not: null } },
        distinct: ['category'],
        select: { category: true },
        orderBy: { category: 'asc' },
      }),
    ]);
    return {
      ...paginate(
        rows.map((r) => this.toPublic(r)),
        total,
        query,
      ),
      categories: categories.map((c) => c.category).filter((c): c is string => Boolean(c)),
    };
  }

  async getPublishedBySlug(slug: string): Promise<GalleryItemDto> {
    const row = await this.prisma.galleryItem.findFirst({
      where: { slug, isPublished: true },
      include: { image: true },
    });
    if (!row) throw new NotFoundException('Artwork not found');
    return this.toPublic(row);
  }

  // ---- Admin ---------------------------------------------------------------

  async listAll(query: AdminGalleryListQueryDto): Promise<AdminGalleryListResponse> {
    const where: Prisma.GalleryItemWhereInput = {
      ...(query.visibility && { isPublished: query.visibility === 'published' }),
      ...(query.category && { category: query.category }),
      ...(query.search && { title: { contains: query.search, mode: 'insensitive' } }),
    };
    const orderBy: Prisma.GalleryItemOrderByWithRelationInput[] =
      query.sort === 'updated' ? [{ updatedAt: 'desc' }] : ORDER;
    const [rows, total, categories] = await this.prisma.$transaction([
      this.prisma.galleryItem.findMany({
        where,
        include: { image: true },
        orderBy,
        ...skipTake(query),
      }),
      this.prisma.galleryItem.count({ where }),
      this.prisma.galleryItem.findMany({
        where: { category: { not: null } },
        distinct: ['category'],
        select: { category: true },
        orderBy: { category: 'asc' },
      }),
    ]);
    return {
      ...paginate(
        rows.map((r) => this.toAdmin(r)),
        total,
        query,
      ),
      categories: categories.map((c) => c.category).filter((c): c is string => Boolean(c)),
    };
  }

  async getById(id: string): Promise<AdminGalleryItem> {
    return this.toAdmin(await this.findOrThrow(id));
  }

  async create(dto: CreateGalleryItemDto): Promise<AdminGalleryItem> {
    await this.media.assertExists(dto.imageId);
    const slug =
      dto.slug ??
      (await uniqueSlug(slugify(dto.title), async (s) =>
        Boolean(await this.prisma.galleryItem.count({ where: { slug: s } })),
      ));
    const row = await this.prisma.galleryItem.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description ?? null,
        category: dto.category ?? null,
        imageId: dto.imageId,
        altText: dto.altText,
        displayOrder: dto.displayOrder ?? 0,
        instagramUrl: dto.instagramUrl ?? null,
        isPublished: dto.isPublished ?? false,
      },
      include: { image: true },
    });
    return this.toAdmin(row);
  }

  async update(id: string, dto: UpdateGalleryItemDto): Promise<AdminGalleryItem> {
    await this.findOrThrow(id);
    if (dto.imageId) await this.media.assertExists(dto.imageId);
    const row = await this.prisma.galleryItem.update({
      where: { id },
      // `?? undefined`: in a partial update, null for a required field means "leave unchanged".
      data: {
        title: dto.title ?? undefined,
        slug: dto.slug ?? undefined,
        description: dto.description,
        category: dto.category,
        imageId: dto.imageId ?? undefined,
        altText: dto.altText ?? undefined,
        displayOrder: dto.displayOrder ?? undefined,
        instagramUrl: dto.instagramUrl,
        isPublished: dto.isPublished ?? undefined,
      },
      include: { image: true },
    });
    return this.toAdmin(row);
  }

  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.galleryItem.delete({ where: { id } });
  }

  // ---- Helpers -------------------------------------------------------------

  private async findOrThrow(id: string): Promise<GalleryWithImage> {
    const row = await this.prisma.galleryItem.findUnique({
      where: { id },
      include: { image: true },
    });
    if (!row) throw new NotFoundException('Artwork not found');
    return row;
  }

  private toPublic(row: GalleryWithImage): GalleryItemDto {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      category: row.category,
      image: this.media.toImageRef(row.image, row.altText),
      displayOrder: row.displayOrder,
      instagramUrl: row.instagramUrl,
    };
  }

  private toAdmin(row: GalleryWithImage): AdminGalleryItem {
    return {
      ...this.toPublic(row),
      altText: row.altText,
      isPublished: row.isPublished,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

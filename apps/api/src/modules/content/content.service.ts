import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AdminContent,
  ContentKindCount,
  ContentLink,
  ContentSummary,
  Paginated,
  PublishedContent,
} from '@ds/contracts';
import { Prisma, type Content, type MediaAsset } from '@prisma/client';
import { paginate, skipTake } from '../../common/dto/pagination.dto';
import { slugify, uniqueSlug } from '../../common/utils/slug';
import { PrismaService } from '../../database/prisma.service';
import { MediaService } from '../media/media.service';
import type {
  AdminContentListQueryDto,
  ContentListQueryDto,
  CreateContentDto,
  UpdateContentDto,
} from './dto/content.dto';

type ContentWithCover = Content & { coverImage: MediaAsset | null };

const PUBLISHED = { status: 'PUBLISHED' } as const;

/** Writing: poems, quotes, prose and book notes. */
@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  // ---- Public --------------------------------------------------------------

  async listPublished(query: ContentListQueryDto): Promise<Paginated<ContentSummary>> {
    const where: Prisma.ContentWhereInput = {
      ...PUBLISHED,
      ...(query.kind && { kind: query.kind }),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        include: { coverImage: true },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        ...skipTake(query),
      }),
      this.prisma.content.count({ where }),
    ]);
    return paginate(
      rows.map((r) => this.toSummary(r)),
      total,
      query,
    );
  }

  async getPublishedBySlug(slug: string): Promise<PublishedContent> {
    const row = await this.prisma.content.findFirst({
      where: { slug, ...PUBLISHED },
      include: { coverImage: true },
    });
    if (!row?.publishedAt) throw new NotFoundException('Writing not found');

    // Neighbours in publication order; ties on publishedAt are broken by id.
    const at = row.publishedAt;
    const select = { slug: true, title: true, kind: true } as const;
    const [newer, older] = await this.prisma.$transaction([
      this.prisma.content.findFirst({
        where: {
          ...PUBLISHED,
          OR: [{ publishedAt: { gt: at } }, { publishedAt: at, id: { gt: row.id } }],
        },
        orderBy: [{ publishedAt: 'asc' }, { id: 'asc' }],
        select,
      }),
      this.prisma.content.findFirst({
        where: {
          ...PUBLISHED,
          OR: [{ publishedAt: { lt: at } }, { publishedAt: at, id: { lt: row.id } }],
        },
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        select,
      }),
    ]);
    return {
      ...this.toSummary(row),
      body: row.body,
      newer: newer satisfies ContentLink | null,
      older: older satisfies ContentLink | null,
    };
  }

  /** Published piece counts per writing type, for discovery navigation. */
  async countPublishedByKind(): Promise<ContentKindCount[]> {
    const groups = await this.prisma.content.groupBy({
      by: ['kind'],
      where: PUBLISHED,
      _count: { _all: true },
      orderBy: { kind: 'asc' },
    });
    return groups.map((g) => ({ kind: g.kind, count: g._count._all }));
  }

  // ---- Admin ---------------------------------------------------------------

  async listAll(query: AdminContentListQueryDto): Promise<Paginated<AdminContent>> {
    const where: Prisma.ContentWhereInput = {
      ...(query.kind && { kind: query.kind }),
      ...(query.status && { status: query.status }),
      ...(query.search && { title: { contains: query.search, mode: 'insensitive' } }),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        include: { coverImage: true },
        orderBy: { updatedAt: 'desc' },
        ...skipTake(query),
      }),
      this.prisma.content.count({ where }),
    ]);
    return paginate(
      rows.map((r) => this.toAdmin(r)),
      total,
      query,
    );
  }

  async getById(id: string): Promise<AdminContent> {
    return this.toAdmin(await this.findOrThrow(id));
  }

  async create(dto: CreateContentDto): Promise<AdminContent> {
    if (dto.coverImageId) await this.media.assertExists(dto.coverImageId);
    const slug = dto.slug ?? (await this.generateSlug(dto.title));
    const row = await this.prisma.content.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt ?? null,
        body: dto.body,
        kind: dto.kind,
        status: dto.status,
        coverImageId: dto.coverImageId ?? null,
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
      },
      include: { coverImage: true },
    });
    return this.toAdmin(row);
  }

  async update(id: string, dto: UpdateContentDto): Promise<AdminContent> {
    const existing = await this.findOrThrow(id);
    if (dto.coverImageId) await this.media.assertExists(dto.coverImageId);
    const becomesPublished = dto.status === 'PUBLISHED' && !existing.publishedAt;
    const row = await this.prisma.content.update({
      where: { id },
      // `?? undefined`: in a partial update, null for a required field means "leave unchanged".
      data: {
        title: dto.title ?? undefined,
        slug: dto.slug ?? undefined,
        excerpt: dto.excerpt,
        body: dto.body ?? undefined,
        kind: dto.kind ?? undefined,
        status: dto.status ?? undefined,
        coverImageId: dto.coverImageId,
        // publishedAt records the first publication and is kept if a piece is unpublished later.
        ...(becomesPublished && { publishedAt: new Date() }),
      },
      include: { coverImage: true },
    });
    return this.toAdmin(row);
  }

  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.content.delete({ where: { id } });
  }

  // ---- Helpers -------------------------------------------------------------

  private async findOrThrow(id: string): Promise<ContentWithCover> {
    const row = await this.prisma.content.findUnique({
      where: { id },
      include: { coverImage: true },
    });
    if (!row) throw new NotFoundException('Writing not found');
    return row;
  }

  private generateSlug(title: string): Promise<string> {
    return uniqueSlug(slugify(title), async (slug) =>
      Boolean(await this.prisma.content.count({ where: { slug } })),
    );
  }

  private toSummary(row: ContentWithCover): ContentSummary {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      kind: row.kind,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      coverImage: row.coverImage ? this.media.toImageRef(row.coverImage) : null,
    };
  }

  private toAdmin(row: ContentWithCover): AdminContent {
    return {
      ...this.toSummary(row),
      body: row.body,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

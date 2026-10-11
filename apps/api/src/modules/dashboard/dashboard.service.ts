import { Injectable } from '@nestjs/common';
import type { DashboardStats } from '@ds/contracts';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(): Promise<DashboardStats> {
    const [content, gallery, newEnquiries, totalEnquiries, media] = await this.prisma.$transaction([
      this.prisma.content.groupBy({
        by: ['status'],
        _count: { _all: true },
        orderBy: { status: 'asc' },
      }),
      this.prisma.galleryItem.groupBy({
        by: ['isPublished'],
        _count: { _all: true },
        orderBy: { isPublished: 'asc' },
      }),
      this.prisma.enquiry.count({ where: { status: 'NEW' } }),
      this.prisma.enquiry.count(),
      this.prisma.mediaAsset.count(),
    ]);
    const contentCount = (status: string) => {
      const group = content.find((g) => g.status === status);
      return typeof group?._count === 'object' ? (group._count._all ?? 0) : 0;
    };
    const galleryCount = (published: boolean) => {
      const group = gallery.find((g) => g.isPublished === published);
      return typeof group?._count === 'object' ? (group._count._all ?? 0) : 0;
    };
    return {
      content: {
        published: contentCount('PUBLISHED'),
        draft: contentCount('DRAFT'),
        archived: contentCount('ARCHIVED'),
      },
      gallery: { published: galleryCount(true), hidden: galleryCount(false) },
      enquiries: { new: newEnquiries, total: totalEnquiries },
      media: { total: media },
    };
  }
}

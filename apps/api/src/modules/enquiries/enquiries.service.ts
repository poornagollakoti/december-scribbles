import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AdminEnquiry, EnquiryReceipt, Paginated } from '@ds/contracts';
import type { Enquiry, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { paginate, skipTake } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  AdminEnquiryListQueryDto,
  CreateEnquiryDto,
  EnquiryStatusUpdateDto,
} from './dto/enquiry.dto';

@Injectable()
export class EnquiriesService {
  private readonly logger = new Logger(EnquiriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Stores the enquiry first, then emails the owner. The visitor's submission succeeds
   * even if email delivery fails; failures are recorded on the enquiry and visible in
   * the admin dashboard, so nothing is lost.
   */
  async submit(dto: CreateEnquiryDto): Promise<EnquiryReceipt> {
    if (dto.website) {
      // Honeypot tripped: answer like a success so bots learn nothing, but store nothing.
      this.logger.warn('Discarded enquiry that filled the honeypot field');
      return { id: randomUUID(), receivedAt: new Date().toISOString() };
    }

    const enquiry = await this.prisma.enquiry.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        type: dto.type,
        subject: dto.subject ?? null,
        message: dto.message,
      },
    });
    this.logger.log({ enquiryId: enquiry.id, type: enquiry.type }, 'Enquiry received');

    await this.sendNotification(enquiry);
    return { id: enquiry.id, receivedAt: enquiry.createdAt.toISOString() };
  }

  async list(query: AdminEnquiryListQueryDto): Promise<Paginated<AdminEnquiry>> {
    const where: Prisma.EnquiryWhereInput = query.status ? { status: query.status } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.enquiry.findMany({ where, orderBy: { createdAt: 'desc' }, ...skipTake(query) }),
      this.prisma.enquiry.count({ where }),
    ]);
    return paginate(rows.map(toAdmin), total, query);
  }

  async getById(id: string): Promise<AdminEnquiry> {
    const row = await this.prisma.enquiry.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Enquiry not found');
    return toAdmin(row);
  }

  async updateStatus(id: string, dto: EnquiryStatusUpdateDto): Promise<AdminEnquiry> {
    await this.getById(id);
    return toAdmin(
      await this.prisma.enquiry.update({ where: { id }, data: { status: dto.status } }),
    );
  }

  /** Permanently deletes an enquiry (e.g. on a data-deletion request). */
  async remove(id: string): Promise<void> {
    await this.getById(id);
    await this.prisma.enquiry.delete({ where: { id } });
  }

  private async sendNotification(enquiry: Enquiry): Promise<void> {
    const result = await this.notifications.notifyNewEnquiry(enquiry);
    await this.prisma.enquiry.update({
      where: { id: enquiry.id },
      data: result.sent
        ? { notifiedAt: new Date(), notificationError: null }
        : { notificationError: result.reason.slice(0, 500) },
    });
  }
}

function toAdmin(row: Enquiry): AdminEnquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    type: row.type,
    subject: row.subject,
    message: row.message,
    status: row.status,
    notifiedAt: row.notifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

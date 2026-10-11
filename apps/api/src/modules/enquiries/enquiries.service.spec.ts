import type { PrismaService } from '../../database/prisma.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { CreateEnquiryDto } from './dto/enquiry.dto';
import { EnquiriesService } from './enquiries.service';

describe('EnquiriesService.submit', () => {
  const dto: CreateEnquiryDto = {
    name: 'Visitor',
    email: 'Visitor@Example.com',
    type: 'GENERAL',
    message: 'Hello there, lovely poems!',
  };
  const stored = {
    id: 'e1',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...dto,
    email: 'visitor@example.com',
  };

  let prisma: { enquiry: { create: jest.Mock; update: jest.Mock } };
  let notifications: { notifyNewEnquiry: jest.Mock };
  let service: EnquiriesService;

  beforeEach(() => {
    prisma = {
      enquiry: {
        create: jest.fn().mockResolvedValue(stored),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    notifications = { notifyNewEnquiry: jest.fn() };
    service = new EnquiriesService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  it('stores the enquiry with a normalised email and records the notification', async () => {
    notifications.notifyNewEnquiry.mockResolvedValue({ sent: true });
    await expect(service.submit(dto)).resolves.toEqual({
      id: 'e1',
      receivedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(prisma.enquiry.create.mock.calls[0][0].data.email).toBe('visitor@example.com');
    expect(prisma.enquiry.update.mock.calls[0][0].data).toEqual({
      notifiedAt: expect.any(Date),
      notificationError: null,
    });
  });

  it('still succeeds when email delivery fails, and records the failure', async () => {
    notifications.notifyNewEnquiry.mockResolvedValue({ sent: false, reason: 'SMTP timeout' });
    await expect(service.submit(dto)).resolves.toMatchObject({ id: 'e1' });
    expect(prisma.enquiry.update.mock.calls[0][0].data).toEqual({
      notificationError: 'SMTP timeout',
    });
  });

  it('silently discards honeypot submissions', async () => {
    const receipt = await service.submit({ ...dto, website: 'http://spam.example' });
    expect(receipt.id).toEqual(expect.any(String));
    expect(prisma.enquiry.create).not.toHaveBeenCalled();
    expect(notifications.notifyNewEnquiry).not.toHaveBeenCalled();
  });
});

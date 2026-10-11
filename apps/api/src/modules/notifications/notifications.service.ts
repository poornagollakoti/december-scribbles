import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ENQUIRY_TYPE_LABELS } from '@ds/contracts';
import type { Enquiry } from '@prisma/client';
import { createTransport, type Transporter } from 'nodemailer';
import { AppConfigService } from '../../config/app-config.service';

export type NotificationResult = { sent: true } | { sent: false; reason: string };

/**
 * Outgoing email. Disabled (every call returns `sent: false`) unless SMTP_HOST and
 * ENQUIRY_NOTIFY_TO are configured, so local development and tests work without SMTP.
 */
@Injectable()
export class NotificationsService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter?: Transporter;

  constructor(private readonly config: AppConfigService) {
    if (config.get('mailEnabled')) {
      this.transporter = createTransport({
        host: config.get('SMTP_HOST'),
        port: config.get('SMTP_PORT'),
        secure: config.get('SMTP_SECURE'),
        auth: config.get('SMTP_USER')
          ? { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASSWORD') }
          : undefined,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 20_000,
      });
    } else {
      this.logger.warn('Email notifications disabled: SMTP_HOST or ENQUIRY_NOTIFY_TO not set');
    }
  }

  async notifyNewEnquiry(enquiry: Enquiry): Promise<NotificationResult> {
    if (!this.transporter) return { sent: false, reason: 'Email notifications are not configured' };
    const typeLabel = ENQUIRY_TYPE_LABELS[enquiry.type];
    try {
      await this.transporter.sendMail({
        from: this.config.get('MAIL_FROM'),
        to: this.config.get('ENQUIRY_NOTIFY_TO'),
        replyTo: { name: singleLine(enquiry.name), address: enquiry.email },
        subject: `New ${typeLabel.toLowerCase()} from ${singleLine(enquiry.name)}`,
        text: [
          `You have a new enquiry on December Scribbles.`,
          ``,
          `Type:    ${typeLabel}`,
          `Name:    ${enquiry.name}`,
          `Email:   ${enquiry.email}`,
          `Subject: ${enquiry.subject ?? '(none)'}`,
          `Sent:    ${enquiry.createdAt.toUTCString()}`,
          ``,
          enquiry.message,
          ``,
          `Reply to this email to answer the sender directly.`,
        ].join('\n'),
      });
      return { sent: true };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown email error';
      this.logger.error(
        { err: error, enquiryId: enquiry.id },
        'Failed to send enquiry notification',
      );
      return { sent: false, reason };
    }
  }

  onModuleDestroy(): void {
    this.transporter?.close();
  }
}

function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').slice(0, 100);
}

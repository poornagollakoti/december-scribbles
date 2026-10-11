import { BadRequestException, Injectable } from '@nestjs/common';
import { LIMITS, type Role } from '@ds/contracts';
import type { AdminUser } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from './password.service';

export interface CreateAdminUserInput {
  email: string;
  name: string;
  password: string;
  role: Role;
}

/**
 * Administrator accounts. There is intentionally no HTTP endpoint for creating users:
 * accounts are provisioned with `npm run admin:create` by someone with server access.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  findByEmail(email: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findUnique({ where: { email: normaliseEmail(email) } });
  }

  async create(input: CreateAdminUserInput): Promise<AdminUser> {
    assertStrongPassword(input.password);
    return this.prisma.adminUser.create({
      data: {
        email: normaliseEmail(input.email),
        name: input.name.trim(),
        role: input.role,
        passwordHash: await this.passwords.hash(input.password),
      },
    });
  }

  async setPassword(userId: string, password: string): Promise<void> {
    assertStrongPassword(password);
    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id: userId },
        data: {
          passwordHash: await this.passwords.hash(password),
          failedLoginCount: 0,
          lockedUntil: null,
        },
      }),
      // A password change signs the user out everywhere.
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function assertStrongPassword(password: string): void {
  if (password.length < LIMITS.passwordMin) {
    throw new BadRequestException(`Password must be at least ${LIMITS.passwordMin} characters`);
  }
  if (password.length > 256) {
    throw new BadRequestException('Password is too long');
  }
}

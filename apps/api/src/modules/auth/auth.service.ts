import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { SessionUser } from '@ds/contracts';
import type { AdminUser } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from '../users/password.service';
import { UsersService } from '../users/users.service';

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;
/** Avoid a database write on every request: only refresh lastUsedAt this often. */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export interface LoginResult {
  token: string;
  expiresAt: Date;
  user: SessionUser;
}

export interface ValidatedSession {
  sessionId: string;
  user: SessionUser;
}

const INVALID_CREDENTIALS = 'Invalid email or password';

/**
 * Server-side sessions: the browser holds an opaque random token in an httpOnly cookie,
 * the database holds its SHA-256 hash. Sessions can be revoked instantly (logout,
 * password change, deactivation) without any token-blacklist machinery.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly config: AppConfigService,
  ) {}

  async login(email: string, password: string, userAgent?: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      await this.passwords.verifyDummy(password);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Same generic message for locked/inactive accounts, to avoid account enumeration.
    const now = new Date();
    if (!user.isActive || (user.lockedUntil && user.lockedUntil > now)) {
      await this.passwords.verifyDummy(password);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (!(await this.passwords.verify(user.passwordHash, password))) {
      await this.recordFailure(user);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(now.getTime() + this.config.get('SESSION_TTL_HOURS') * 3600_000);

    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedLoginCount: 0,
          lockedUntil: null,
          lastLoginAt: now,
          ...(this.passwords.needsRehash(user.passwordHash)
            ? { passwordHash: await this.passwords.hash(password) }
            : {}),
        },
      }),
      this.prisma.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: now } } }),
      this.prisma.session.create({
        data: {
          tokenHash: hashToken(token),
          userId: user.id,
          expiresAt,
          userAgent: userAgent?.slice(0, 300),
        },
      }),
    ]);

    this.logger.log({ userId: user.id }, 'Admin signed in');
    return { token, expiresAt, user: toSessionUser(user) };
  }

  async validate(token: string | undefined): Promise<ValidatedSession | null> {
    if (!token || token.length > 100) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    const now = new Date();
    if (!session || session.revokedAt || session.expiresAt <= now || !session.user.isActive) {
      return null;
    }
    if (now.getTime() - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
      await this.prisma.session.update({ where: { id: session.id }, data: { lastUsedAt: now } });
    }
    return { sessionId: session.id, user: toSessionUser(session.user) };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async recordFailure(user: AdminUser): Promise<void> {
    const failures = user.failedLoginCount + 1;
    const lock = failures >= MAX_FAILED_LOGINS;
    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedLoginCount: lock ? 0 : failures,
        lockedUntil: lock ? new Date(Date.now() + LOCKOUT_MS) : user.lockedUntil,
      },
    });
    if (lock) this.logger.warn({ userId: user.id }, 'Admin account locked after failed logins');
  }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function toSessionUser(user: AdminUser): SessionUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

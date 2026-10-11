import { UnauthorizedException } from '@nestjs/common';
import type { AdminUser } from '@prisma/client';
import type { AppConfigService } from '../../config/app-config.service';
import type { PrismaService } from '../../database/prisma.service';
import type { UsersService } from '../users/users.service';
import { AuthService, hashToken, LOCKOUT_MS, MAX_FAILED_LOGINS } from './auth.service';

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'u1',
    email: 'admin@example.com',
    name: 'Admin',
    passwordHash: 'hash',
    role: 'ADMIN',
    isActive: true,
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AuthService', () => {
  let prisma: {
    adminUser: { update: jest.Mock };
    session: {
      create: jest.Mock;
      deleteMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let users: { findByEmail: jest.Mock };
  let passwords: {
    verify: jest.Mock;
    verifyDummy: jest.Mock;
    needsRehash: jest.Mock;
    hash: jest.Mock;
  };
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      adminUser: { update: jest.fn().mockResolvedValue({}) },
      session: {
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    users = { findByEmail: jest.fn() };
    passwords = {
      verify: jest.fn(),
      verifyDummy: jest.fn().mockResolvedValue(false),
      needsRehash: jest.fn().mockReturnValue(false),
      hash: jest.fn(),
    };
    const config = { get: jest.fn().mockReturnValue(168) } as unknown as AppConfigService;
    service = new AuthService(
      prisma as unknown as PrismaService,
      users as unknown as UsersService,
      passwords,
      config,
    );
  });

  describe('login', () => {
    it('rejects unknown emails after a timing-equalising dummy verification', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(service.login('x@example.com', 'pw')).rejects.toThrow(UnauthorizedException);
      expect(passwords.verifyDummy).toHaveBeenCalled();
    });

    it('rejects locked accounts with the same generic message, without checking the password', async () => {
      users.findByEmail.mockResolvedValue(makeUser({ lockedUntil: new Date(Date.now() + 60_000) }));
      await expect(service.login('admin@example.com', 'right')).rejects.toThrow(
        'Invalid email or password',
      );
      expect(passwords.verify).not.toHaveBeenCalled();
    });

    it('rejects deactivated accounts', async () => {
      users.findByEmail.mockResolvedValue(makeUser({ isActive: false }));
      await expect(service.login('admin@example.com', 'right')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('counts failed attempts', async () => {
      users.findByEmail.mockResolvedValue(makeUser({ failedLoginCount: 1 }));
      passwords.verify.mockResolvedValue(false);
      await expect(service.login('admin@example.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { failedLoginCount: 2, lockedUntil: null },
      });
    });

    it(`locks the account after ${MAX_FAILED_LOGINS} failures`, async () => {
      users.findByEmail.mockResolvedValue(makeUser({ failedLoginCount: MAX_FAILED_LOGINS - 1 }));
      passwords.verify.mockResolvedValue(false);
      const before = Date.now();
      await expect(service.login('admin@example.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
      const data = prisma.adminUser.update.mock.calls[0][0].data as {
        lockedUntil: Date;
        failedLoginCount: number;
      };
      expect(data.failedLoginCount).toBe(0);
      expect(data.lockedUntil.getTime()).toBeGreaterThanOrEqual(before + LOCKOUT_MS);
    });

    it('creates a session storing only the token hash', async () => {
      users.findByEmail.mockResolvedValue(makeUser());
      passwords.verify.mockResolvedValue(true);
      const result = await service.login('admin@example.com', 'right', 'jest');
      expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(result.user).toEqual({
        id: 'u1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'ADMIN',
      });
      const created = prisma.session.create.mock.calls[0][0].data as { tokenHash: string };
      expect(created.tokenHash).toBe(hashToken(result.token));
      expect(created.tokenHash).not.toContain(result.token);
    });
  });

  describe('validate', () => {
    const session = (overrides = {}) => ({
      id: 's1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      lastUsedAt: new Date(),
      user: makeUser(),
      ...overrides,
    });

    it('returns null without a token', async () => {
      await expect(service.validate(undefined)).resolves.toBeNull();
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
    });

    it('accepts an active session', async () => {
      prisma.session.findUnique.mockResolvedValue(session());
      await expect(service.validate('token')).resolves.toMatchObject({
        sessionId: 's1',
        user: { id: 'u1' },
      });
    });

    it.each([
      ['revoked', { revokedAt: new Date() }],
      ['expired', { expiresAt: new Date(Date.now() - 1) }],
      ['for a deactivated user', { user: makeUser({ isActive: false }) }],
    ])('rejects a session that is %s', async (_label, overrides) => {
      prisma.session.findUnique.mockResolvedValue(session(overrides));
      await expect(service.validate('token')).resolves.toBeNull();
    });
  });
});

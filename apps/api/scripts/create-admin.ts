/**
 * Creates an administrator account, or resets the password of an existing one.
 *
 *   npm run admin:create -w @ds/api -- --email you@example.com --name "Your Name" [--role ADMIN|EDITOR]
 *
 * The password is read from the ADMIN_PASSWORD environment variable or prompted for
 * (input hidden), so it never appears in shell history or process listings.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { ROLES, type Role } from '@ds/contracts';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { parseArgs } from 'node:util';
import { PasswordService } from '../src/modules/users/password.service';
import { assertStrongPassword, normaliseEmail } from '../src/modules/users/users.service';

async function promptHidden(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk: Buffer, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    muted = true;
  });
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string', default: 'ADMIN' },
    },
  });
  if (!values.email) throw new Error('--email is required');
  const role = values.role?.toUpperCase() as Role;
  if (!ROLES.includes(role)) throw new Error(`--role must be one of ${ROLES.join(', ')}`);

  const password = process.env.ADMIN_PASSWORD ?? (await promptHidden('Password (min 12 chars): '));
  assertStrongPassword(password);

  const prisma = new PrismaClient();
  try {
    const email = normaliseEmail(values.email);
    const passwordHash = await new PasswordService().hash(password);
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      await prisma.$transaction([
        prisma.adminUser.update({
          where: { email },
          data: { passwordHash, role, isActive: true, failedLoginCount: 0, lockedUntil: null },
        }),
        prisma.session.updateMany({
          where: { userId: existing.id, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      ]);
      console.log(`Updated ${email} (${role}); existing sessions were signed out.`);
    } else {
      await prisma.adminUser.create({
        data: { email, name: values.name?.trim() || email.split('@')[0], role, passwordHash },
      });
      console.log(`Created ${role} account for ${email}.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

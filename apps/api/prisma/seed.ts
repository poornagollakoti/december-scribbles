/**
 * Idempotent seed. Creates the site profile with facts confirmed from the brand's Instagram
 * profile only — no invented writing, artwork or testimonials. Real content is added
 * through the admin dashboard.
 */
import { PrismaClient } from '@prisma/client';
import { DEFAULT_PROFILE } from '../src/modules/site-profile/site-profile.service';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.siteProfile.upsert({
    where: { id: 1 },
    create: { id: 1, ...DEFAULT_PROFILE },
    update: {},
  });
  console.log('Seeded site profile (existing values were left unchanged).');
  console.log('Create an administrator with: npm run admin:create -w @ds/api -- --email <email>');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());

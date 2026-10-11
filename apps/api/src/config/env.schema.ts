import { z } from 'zod';

const bool = (fallback: boolean) =>
  z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === 'true' || v === '1'));

const csv = z
  .string()
  .min(1)
  .transform((v) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

/**
 * Environment variables, validated at startup. The process exits with a readable
 * message if anything required is missing or malformed.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    /** Number of reverse-proxy hops in front of the API (for correct client IPs). */
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),

    DATABASE_URL: z.string().url(),
    FRONTEND_ORIGINS: csv,

    SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
    COOKIE_SECURE: z.enum(['true', 'false', '1', '0']).optional(),
    SWAGGER_ENABLED: z.enum(['true', 'false', '1', '0']).optional(),

    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().min(1).default('us-east-1'),
    S3_BUCKET: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    S3_FORCE_PATH_STYLE: bool(false),
    /** Public base URL that serves objects from the bucket (CDN or bucket URL), no trailing slash. */
    MEDIA_PUBLIC_BASE_URL: z
      .string()
      .url()
      .transform((v) => v.replace(/\/+$/, '')),

    /** Email is optional: without SMTP_HOST, enquiries are stored but no notification is sent. */
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().default(587),
    SMTP_SECURE: bool(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().min(3).default('December Scribbles <no-reply@localhost>'),
    ENQUIRY_NOTIFY_TO: z.string().email().optional(),
  })
  .transform((env) => {
    const isProd = env.NODE_ENV === 'production';
    const flag = (v: string | undefined, fallback: boolean) =>
      v === undefined ? fallback : v === 'true' || v === '1';
    return {
      ...env,
      isProduction: isProd,
      cookieSecure: flag(env.COOKIE_SECURE, isProd),
      swaggerEnabled: flag(env.SWAGGER_ENABLED, !isProd),
      mailEnabled: Boolean(env.SMTP_HOST && env.ENQUIRY_NOTIFY_TO),
    };
  });

export type AppConfig = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): AppConfig {
  // Treat empty values (e.g. `SMTP_HOST=`) as unset.
  const cleaned = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== ''));
  const result = envSchema.safeParse(cleaned);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

import { validateEnv } from './env.schema';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  FRONTEND_ORIGINS: 'http://localhost:3000, https://example.com',
  S3_BUCKET: 'bucket',
  S3_ACCESS_KEY_ID: 'key',
  S3_SECRET_ACCESS_KEY: 'secret',
  MEDIA_PUBLIC_BASE_URL: 'https://cdn.example.com/media/',
};

describe('validateEnv', () => {
  it('parses and derives settings', () => {
    const env = validateEnv(base);
    expect(env.FRONTEND_ORIGINS).toEqual(['http://localhost:3000', 'https://example.com']);
    expect(env.MEDIA_PUBLIC_BASE_URL).toBe('https://cdn.example.com/media');
    expect(env.PORT).toBe(4000);
    expect(env.cookieSecure).toBe(false);
    expect(env.swaggerEnabled).toBe(true);
    expect(env.mailEnabled).toBe(false);
  });

  it('defaults to secure cookies and no Swagger in production', () => {
    const env = validateEnv({ ...base, NODE_ENV: 'production' });
    expect(env.cookieSecure).toBe(true);
    expect(env.swaggerEnabled).toBe(false);
  });

  it('enables mail only when host and recipient are both set', () => {
    expect(validateEnv({ ...base, SMTP_HOST: 'smtp' }).mailEnabled).toBe(false);
    expect(
      validateEnv({ ...base, SMTP_HOST: 'smtp', ENQUIRY_NOTIFY_TO: 'me@example.com' }).mailEnabled,
    ).toBe(true);
  });

  it('treats empty values as unset', () => {
    expect(validateEnv({ ...base, SMTP_HOST: '', PORT: '' })).toMatchObject({
      mailEnabled: false,
      PORT: 4000,
    });
  });

  it('reports every invalid variable', () => {
    expect(() => validateEnv({ ...base, DATABASE_URL: 'nope', PORT: 'x' })).toThrow(
      /DATABASE_URL[\s\S]*PORT|PORT[\s\S]*DATABASE_URL/,
    );
  });
});

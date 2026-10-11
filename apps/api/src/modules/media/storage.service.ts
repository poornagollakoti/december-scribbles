import {
  DeleteObjectsCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';

/**
 * Thin wrapper around S3-compatible object storage (AWS S3, Cloudflare R2, MinIO...).
 * Credentials never leave the server; browsers only ever receive public object URLs.
 */
@Injectable()
export class StorageService implements OnModuleDestroy {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(config: AppConfigService) {
    this.bucket = config.get('S3_BUCKET');
    this.publicBaseUrl = config.get('MEDIA_PUBLIC_BASE_URL');
    this.client = new S3Client({
      region: config.get('S3_REGION'),
      endpoint: config.get('S3_ENDPOINT'),
      forcePathStyle: config.get('S3_FORCE_PATH_STYLE'),
      credentials: {
        accessKeyId: config.get('S3_ACCESS_KEY_ID'),
        secretAccessKey: config.get('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Keys are unique per upload, so objects never change and can be cached forever.
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  }

  async delete(keys: string[]): Promise<void> {
    if (!keys.length) return;
    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }

  async isReachable(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }
}

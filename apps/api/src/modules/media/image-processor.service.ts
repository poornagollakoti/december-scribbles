import { Injectable, UnsupportedMediaTypeException } from '@nestjs/common';
import sharp from 'sharp';

const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif']);
const FULL_MAX_PX = 2400;
const THUMB_MAX_PX = 640;
/** Rejects decompression bombs (~40 megapixels). */
const MAX_INPUT_PIXELS = 40_000_000;

export interface ProcessedImage {
  full: { data: Buffer; width: number; height: number };
  thumb: { data: Buffer; width: number; height: number };
  sourceFormat: string;
}

/**
 * Validates uploads by actually decoding them (the declared MIME type and file name are
 * never trusted), then re-encodes to WebP. Re-encoding strips EXIF/GPS metadata and any
 * payload smuggled alongside the image data.
 */
@Injectable()
export class ImageProcessorService {
  async process(input: Buffer): Promise<ProcessedImage> {
    let format: string | undefined;
    try {
      format = (await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata()).format;
    } catch {
      throw new UnsupportedMediaTypeException('The file is not a readable image');
    }
    if (!format || !ACCEPTED_FORMATS.has(format)) {
      throw new UnsupportedMediaTypeException('Only JPEG, PNG, WebP and GIF images are accepted');
    }

    const [full, thumb] = await Promise.all([
      this.encode(input, FULL_MAX_PX, 85),
      this.encode(input, THUMB_MAX_PX, 78),
    ]);
    return { full, thumb, sourceFormat: format };
  }

  private async encode(input: Buffer, maxPx: number, quality: number) {
    const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate() // honour EXIF orientation before metadata is stripped
      .resize({ width: maxPx, height: maxPx, fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  }
}

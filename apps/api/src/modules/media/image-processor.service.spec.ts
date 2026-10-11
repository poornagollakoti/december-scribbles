import { UnsupportedMediaTypeException } from '@nestjs/common';
import sharp from 'sharp';
import { ImageProcessorService } from './image-processor.service';

describe('ImageProcessorService', () => {
  const service = new ImageProcessorService();

  it('re-encodes images to WebP, bounding the size and stripping metadata', async () => {
    const input = await sharp({
      create: { width: 3000, height: 1500, channels: 3, background: '#a83f55' },
    })
      .withMetadata({ exif: { IFD0: { Copyright: 'secret-location' } } })
      .jpeg()
      .toBuffer();

    const result = await service.process(input);

    expect(result.sourceFormat).toBe('jpeg');
    expect(result.full).toMatchObject({ width: 2400, height: 1200 });
    expect(result.thumb).toMatchObject({ width: 640, height: 320 });
    const meta = await sharp(result.full.data).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.exif).toBeUndefined();
  });

  it('does not upscale small images', async () => {
    const input = await sharp({
      create: { width: 200, height: 100, channels: 4, background: '#fff' },
    })
      .png()
      .toBuffer();
    const result = await service.process(input);
    expect(result.full).toMatchObject({ width: 200, height: 100 });
  });

  it('rejects files that are not images, whatever their name or declared type', async () => {
    await expect(service.process(Buffer.from('<?php echo "hi"; ?>'))).rejects.toThrow(
      UnsupportedMediaTypeException,
    );
  });

  it('rejects image formats outside the allow-list', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    );
    await expect(service.process(svg)).rejects.toThrow(
      'Only JPEG, PNG, WebP and GIF images are accepted',
    );
  });
});

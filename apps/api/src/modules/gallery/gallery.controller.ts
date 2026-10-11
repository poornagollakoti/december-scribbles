import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { GalleryItem, GalleryListResponse } from '@ds/contracts';
import { GalleryListQueryDto } from './dto/gallery.dto';
import { GalleryService } from './gallery.service';

@ApiTags('gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly gallery: GalleryService) {}

  @Get()
  @ApiOperation({ summary: 'Published artwork in display order, with the available categories' })
  list(@Query() query: GalleryListQueryDto): Promise<GalleryListResponse> {
    return this.gallery.listPublished(query);
  }

  @Get(':slug')
  @ApiNotFoundResponse({ description: 'No published artwork with this slug' })
  get(@Param('slug') slug: string): Promise<GalleryItem> {
    return this.gallery.getPublishedBySlug(slug);
  }
}

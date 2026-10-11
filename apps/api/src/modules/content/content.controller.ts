import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ContentKindCount, ContentSummary, Paginated, PublishedContent } from '@ds/contracts';
import { ContentService } from './content.service';
import { ContentListQueryDto } from './dto/content.dto';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  @ApiOperation({ summary: 'Published writing, newest first' })
  list(@Query() query: ContentListQueryDto): Promise<Paginated<ContentSummary>> {
    return this.content.listPublished(query);
  }

  @Get('meta/kinds')
  @ApiOperation({ summary: 'Number of published pieces per writing type' })
  kinds(): Promise<ContentKindCount[]> {
    return this.content.countPublishedByKind();
  }

  @Get(':slug')
  @ApiNotFoundResponse({ description: 'No published writing with this slug' })
  get(@Param('slug') slug: string): Promise<PublishedContent> {
    return this.content.getPublishedBySlug(slug);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { AdminContent, Paginated } from '@ds/contracts';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SessionGuard } from '../auth/session.guard';
import { ContentService } from './content.service';
import { AdminContentListQueryDto, CreateContentDto, UpdateContentDto } from './dto/content.dto';

@ApiTags('admin: content')
@ApiCookieAuth()
@UseGuards(SessionGuard, RolesGuard)
@Controller('admin/content')
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  list(@Query() query: AdminContentListQueryDto): Promise<Paginated<AdminContent>> {
    return this.content.listAll(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<AdminContent> {
    return this.content.getById(id);
  }

  @Post()
  create(@Body() dto: CreateContentDto): Promise<AdminContent> {
    return this.content.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentDto,
  ): Promise<AdminContent> {
    return this.content.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.content.remove(id);
  }
}

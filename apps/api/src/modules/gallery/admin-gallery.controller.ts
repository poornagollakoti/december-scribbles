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
import type { AdminGalleryItem, AdminGalleryListResponse } from '@ds/contracts';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SessionGuard } from '../auth/session.guard';
import {
  AdminGalleryListQueryDto,
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
} from './dto/gallery.dto';
import { GalleryService } from './gallery.service';

@ApiTags('admin: gallery')
@ApiCookieAuth()
@UseGuards(SessionGuard, RolesGuard)
@Controller('admin/gallery')
export class AdminGalleryController {
  constructor(private readonly gallery: GalleryService) {}

  @Get()
  list(@Query() query: AdminGalleryListQueryDto): Promise<AdminGalleryListResponse> {
    return this.gallery.listAll(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<AdminGalleryItem> {
    return this.gallery.getById(id);
  }

  @Post()
  create(@Body() dto: CreateGalleryItemDto): Promise<AdminGalleryItem> {
    return this.gallery.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGalleryItemDto,
  ): Promise<AdminGalleryItem> {
    return this.gallery.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.gallery.remove(id);
  }
}

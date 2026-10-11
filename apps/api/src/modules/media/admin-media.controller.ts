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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { LIMITS, type MediaAsset, type Paginated, type SessionUser } from '@ds/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SessionGuard } from '../auth/session.guard';
import { UpdateMediaDto, UploadMediaDto } from './dto/media.dto';
import { MediaService } from './media.service';

@ApiTags('admin: media')
@ApiCookieAuth()
@UseGuards(SessionGuard, RolesGuard)
@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  list(@Query() query: PaginationQueryDto): Promise<Paginated<MediaAsset>> {
    return this.media.list(query);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPEG, PNG, WebP or GIF, max 10 MB',
        },
        altText: { type: 'string', maxLength: LIMITS.altTextMax },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      // No `dest`: files are buffered in memory (bounded by fileSize) and never touch disk.
      limits: { fileSize: LIMITS.uploadMaxBytes, files: 1, fields: 5 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadMediaDto,
    @CurrentUser() user: SessionUser,
  ): Promise<MediaAsset> {
    return this.media.upload(file, body.altText ?? '', user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMediaDto,
  ): Promise<MediaAsset> {
    return this.media.updateAltText(id, body.altText);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.media.remove(id);
  }
}

import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { BooksService } from './books.service';
import { bookImageMulterOptions } from './uploads/book-upload.config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { CreateBookRequestDto } from './dto/create-book-request.dto';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  // ─── Public Endpoints ────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Browse approved books (public)' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    const filter: Record<string, any> = {};
    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    return this.booksService.getCustomerBooks(filter, page || 1, limit || 8);
  }

  @Get('best-sellers')
  @ApiOperation({ summary: 'Top rated books' })
  async getBestSellers(@Query('limit') limit?: number) {
    return this.booksService.getBestSellers(limit || 8);
  }

  @Get('approved')
  @ApiOperation({ summary: 'Get all approved books (for seller listing)' })
  async getApprovedBooks() {
    return this.booksService.getApprovedBooks();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book details' })
  async findById(@Param('id') id: string) {
    return this.booksService.findById(id);
  }

  @Get(':id/images/:index')
  @ApiOperation({ summary: 'Get a book image by index' })
  async getImage(
    @Param('id') id: string,
    @Param('index') index: string,
    @Res() res: Response,
  ) {
    const result = await this.booksService.getBookImage(id, parseInt(index) || 0);
    res.set('Content-Type', result.mimetype);
    res.set('Content-Disposition', `inline; filename="${result.filename}"`);
    res.send(result.data);
  }

  // ─── Seller / Admin Endpoints ────────────────────

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image', bookImageMulterOptions))
  @ApiOperation({ summary: 'Upload an image for a book' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WEBP, GIF) max 5MB',
        },
      },
    },
  })
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) throw new BadRequestException('No image file provided');
    return this.booksService.uploadBookImage(id, file, user.sub);
  }

  @Delete(':id/images/:index')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a book image by index' })
  async deleteImage(
    @Param('id') id: string,
    @Param('index') index: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.booksService.deleteBookImage(id, parseInt(index) || 0, user.sub);
  }
}
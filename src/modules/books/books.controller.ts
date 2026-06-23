import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

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
}
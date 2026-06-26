import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookRequestDto } from './dto/create-book-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Seller Books')
@Controller('seller/books')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SellerBooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @ApiOperation({ summary: 'Request a new book (seller)' })
  async create(@Body() data: CreateBookRequestDto, @CurrentUser() user: JwtPayload) {
    return this.booksService.create(data, user.sub);
  }
}
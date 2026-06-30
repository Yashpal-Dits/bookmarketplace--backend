import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BooksService } from './books.service';
import { CreateBookRequestDto } from './dto/create-book-request.dto';
import { bookCoverImageMulterOptions } from './uploads/book-upload.config';
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
  @UseInterceptors(FileInterceptor('coverImage', bookCoverImageMulterOptions))
  @ApiOperation({ summary: 'Request a new book with optional cover image upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['isbn', 'title', 'author', 'description'],
      properties: {
        isbn: { type: 'string', example: '9783161484100' },
        title: { type: 'string', example: 'The Great Gatsby' },
        author: { type: 'string', example: 'F. Scott Fitzgerald' },
        publisher: { type: 'string', example: 'Scribner' },
        description: {
          type: 'string',
          example: 'A story of wealth, love, and the American Dream...',
        },
        category: {
          type: 'string',
          example: '67a1b2c3d4e5f6a7b8c9d0e1',
          description: 'Optional category ObjectId',
        },
        coverImage: {
          type: 'string',
          format: 'binary',
          description: 'Optional book cover image',
        },
      },
    },
  })
  async create(
    @Body() data: CreateBookRequestDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.booksService.create(data, user.sub, file);
  }
}
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  UsePipes,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookQueryDto } from './dto/book-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/constants/roles.constant';
import { JoiValidationPipe } from '../../common/pipes/joi-validation.pipe';
import { createBookSchema } from './validation/create-book.schema';
import { updateBookSchema } from './validation/update-book.schema';
import { bookQuerySchema } from './validation/book-query.schema';
import { BookUploadService } from './uploads/book-upload.service';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly bookUploadService: BookUploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Book data with optional images',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'The Great Gatsby' },
        author: { type: 'string', example: 'F. Scott Fitzgerald' },
        description: { type: 'string', example: 'A story of wealth, love, and the American Dream...' },
        price: { type: 'number', example: 499 },
        category: { type: 'string', example: '67a1b2c3d4e5f6a7b8c9d0e1' },
        stock: { type: 'number', example: 10 },
        isbn: { type: 'string', example: '978-3-16-148410-0' },
        publisher: { type: 'string', example: 'Scribner' },
        publishedYear: { type: 'number', example: 1925 },
        language: { type: 'string', example: 'English' },
        pageCount: { type: 'number', example: 180 },
        images: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Book cover images (max 5 files)' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 5, {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  }))
  async create(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('sub') userId: string,
  ) {
    // Parse the body since multer sends it as form-data (strings)
    const createBookDto: CreateBookDto = {
      title: body.title,
      author: body.author,
      description: body.description,
      price: parseFloat(body.price),
      category: body.category,
      stock: parseInt(body.stock, 10),
      isbn: body.isbn || undefined,
      publisher: body.publisher || undefined,
      publishedYear: body.publishedYear ? parseInt(body.publishedYear, 10) : undefined,
      language: body.language || undefined,
      pageCount: body.pageCount ? parseInt(body.pageCount, 10) : undefined,
    };

    // Validate with Joi
    const { error, value } = createBookSchema.validate(createBookDto, { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map((d) => d.message);
      throw new BadRequestException({
        success: false,
        message: 'Validation failed',
        errors: messages,
        statusCode: 400,
      });
    }

    // Upload images if provided
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await this.bookUploadService.uploadMultiple(files);
    }

    return this.booksService.create({ ...value, images: imageUrls }, userId);
  }

  @Get()
  @UsePipes(new JoiValidationPipe(bookQuerySchema))
  async findAll(@Query() query: BookQueryDto) {
    return this.booksService.findAll(query);
  }

  @Get('my-books')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  async findMyBooks(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.booksService.findMyBooks(userId, page || 1, limit || 10);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.booksService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 5))
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('sub') userId: string,
  ) {
    const updateBookDto: UpdateBookDto = {};
    if (body.title) updateBookDto.title = body.title;
    if (body.author) updateBookDto.author = body.author;
    if (body.description) updateBookDto.description = body.description;
    if (body.price) updateBookDto.price = parseFloat(body.price);
    if (body.category) updateBookDto.category = body.category;
    if (body.stock) updateBookDto.stock = parseInt(body.stock, 10);
    if (body.isbn !== undefined) updateBookDto.isbn = body.isbn;
    if (body.publisher !== undefined) updateBookDto.publisher = body.publisher;
    if (body.publishedYear) updateBookDto.publishedYear = parseInt(body.publishedYear, 10);
    if (body.language !== undefined) updateBookDto.language = body.language;
    if (body.pageCount) updateBookDto.pageCount = parseInt(body.pageCount, 10);
    if (body.isAvailable !== undefined) updateBookDto.isAvailable = body.isAvailable === 'true' || body.isAvailable === true;

    if (files && files.length > 0) {
      const imageUrls = await this.bookUploadService.uploadMultiple(files);
      updateBookDto.images = imageUrls;
    }

    return this.booksService.update(id, updateBookDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.ADMIN)
  @ApiBearerAuth()
  async delete(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.booksService.delete(id, userId);
  }
}
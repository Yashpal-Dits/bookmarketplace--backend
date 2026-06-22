import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BooksRepository } from './books.repository';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookQueryDto } from './dto/book-query.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class BooksService {
  constructor(
    private readonly booksRepository: BooksRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(createBookDto: CreateBookDto, sellerId: string) {
    const book = await this.booksRepository.create(createBookDto, sellerId);

    this.logger.log(`Book created: "${book.title}" by seller: ${sellerId}`, 'Books');

    return {
      success: true,
      message: SUCCESS_MESSAGES.BOOK_CREATED,
      data: book,
    };
  }

  async findAll(query: BookQueryDto) {
    const filter: any = { isAvailable: true };

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { author: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = query.minPrice;
      if (query.maxPrice) filter.price.$lte = query.maxPrice;
    }

    const sort: Record<string, 1 | -1> = {};
    sort[query.sort || 'createdAt'] = query.order === 'asc' ? 1 : -1;

    const { books, total } = await this.booksRepository.findAll(
      filter,
      sort,
      query.page || 1,
      query.limit || 10,
    );

    return {
      success: true,
      message: SUCCESS_MESSAGES.BOOKS_FETCHED,
      data: books,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(total / (query.limit || 10)),
      },
    };
  }

  async findById(id: string) {
    const book = await this.booksRepository.findById(id);

    if (!book) {
      this.logger.warn(`Book not found: ${id}`, 'Books');
      throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);
    }

    return {
      success: true,
      message: SUCCESS_MESSAGES.BOOK_FETCHED,
      data: book,
    };
  }

  async findMyBooks(sellerId: string, page = 1, limit = 10) {
    const { books, total } = await this.booksRepository.findBySeller(sellerId, page, limit);

    return {
      success: true,
      message: SUCCESS_MESSAGES.BOOKS_FETCHED,
      data: books,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateBookDto: UpdateBookDto, userId: string) {
    const book = await this.booksRepository.findById(id);

    if (!book) {
      this.logger.warn(`Update failed - book not found: ${id}`, 'Books');
      throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);
    }

    if (book.seller.toString() !== userId && userId !== 'admin') {
      this.logger.warn(`Update failed - unauthorized: user ${userId} tried to update book ${id}`, 'Books');
      throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
    }

    const updatedBook = await this.booksRepository.update(id, updateBookDto);

    this.logger.log(`Book updated: "${book.title}" (${id})`, 'Books');

    return {
      success: true,
      message: SUCCESS_MESSAGES.BOOK_UPDATED,
      data: updatedBook,
    };
  }

  async delete(id: string, userId: string) {
    const book = await this.booksRepository.findById(id);

    if (!book) {
      this.logger.warn(`Delete failed - book not found: ${id}`, 'Books');
      throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);
    }

    if (book.seller.toString() !== userId && userId !== 'admin') {
      this.logger.warn(`Delete failed - unauthorized: user ${userId} tried to delete book ${id}`, 'Books');
      throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
    }

    await this.booksRepository.delete(id);

    this.logger.log(`Book deleted: "${book.title}" (${id})`, 'Books');

    return {
      success: true,
      message: SUCCESS_MESSAGES.BOOK_DELETED,
    };
  }
}
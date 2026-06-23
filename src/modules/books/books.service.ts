import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { BooksRepository } from './books.repository';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class BooksService {
  constructor(
    private readonly booksRepository: BooksRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(data: any, sellerId: string) {
    const existing = await this.booksRepository.findByIsbn(data.isbn);
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.ISBN_ALREADY_EXISTS);
    }

    const book = await this.booksRepository.create({
      ...data,
      createdBySellerId: sellerId,
    });

    this.logger.log(`Book requested: ${book.title} by seller ${sellerId}`, 'Books');

    return { success: true, message: SUCCESS_MESSAGES.BOOK_CREATED, data: book };
  }

  async findById(id: string) {
    const book = await this.booksRepository.findById(id);
    if (!book) throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);
    return { success: true, message: SUCCESS_MESSAGES.BOOK_FETCHED, data: book };
  }

  async getApprovedBooks() {
    const { data } = await this.booksRepository.findAll({ status: 'APPROVED' }, 1, 1000);
    return { success: true, message: SUCCESS_MESSAGES.BOOKS_FETCHED, data };
  }

  async getBestSellers(limit = 8) {
    const data = await this.booksRepository.findBestSellers(limit);
    return { success: true, message: SUCCESS_MESSAGES.BOOKS_FETCHED, data };
  }

  async getCustomerBooks(filter: Record<string, any> = {}, page = 1, limit = 8) {
    const query = { status: 'APPROVED', ...filter };
    const { data, total } = await this.booksRepository.findAll(query, page, limit);
    return {
      success: true,
      message: SUCCESS_MESSAGES.BOOKS_FETCHED,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
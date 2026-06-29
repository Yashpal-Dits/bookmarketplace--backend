import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BooksRepository } from './books.repository';
import { Book } from './schemas/book.schema';
import { User } from '../users/schemas/user.schema';
import { Role } from '../../common/enums/role.enum';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    private readonly booksRepository: BooksRepository,
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(data: any, sellerId: string) {
    try {
      const existing = await this.booksRepository.findByIsbn(data.isbn);
      if (existing) throw new ConflictException(ERROR_MESSAGES.ISBN_ALREADY_EXISTS);

      const book = await this.booksRepository.create({ ...data, createdBySellerId: sellerId });
      this.logger.log(`Book requested: ${book.title} by seller ${sellerId}`, 'Books');

      return { success: true, message: SUCCESS_MESSAGES.BOOK_CREATED, data: book };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Create book failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const book = await this.booksRepository.findById(id);
      if (!book) throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);
      return { success: true, message: SUCCESS_MESSAGES.BOOK_FETCHED, data: book };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Find book failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async getApprovedBooks() {
    try {
      const { data } = await this.booksRepository.findAll({ status: 'APPROVED' as any }, 1, 1000);
      return { success: true, message: SUCCESS_MESSAGES.BOOKS_FETCHED, data };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Get approved books failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async getBestSellers(limit = 8) {
    try {
      const data = await this.booksRepository.findBestSellers(limit);
      return { success: true, message: SUCCESS_MESSAGES.BOOKS_FETCHED, data };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Get best sellers failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async getCustomerBooks(filter: Record<string, any> = {}, page = 1, limit = 8) {
    try {
      const query = { status: 'APPROVED', ...filter };
      const { data, total } = await this.booksRepository.findAll(query, page, limit);
      return {
        success: true,
        message: SUCCESS_MESSAGES.BOOKS_FETCHED,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Get customer books failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // ─── Upload Book Image ─────────────────────────────
  async uploadBookImage(bookId: string, file: Express.Multer.File, userId: string) {
    try {
      const book = await this.booksRepository.findById(bookId);
      if (!book) throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);

      if (book.createdBySellerId?.toString() !== userId) {
        const user = await this.userModel.findById(userId).exec();
        if (user?.role !== Role.ADMIN) throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
      }

      const imageData = {
        filename: file.originalname,
        mimetype: file.mimetype,
        data: file.buffer,
        size: file.size,
      };

      const updated = await this.bookModel.findByIdAndUpdate(
        bookId,
        { $push: { images: imageData } },
        { new: true },
      ).exec();

      this.logger.log(`Image uploaded for book: ${book.title}`, 'Books');

      return {
        success: true,
        message: 'Book image uploaded successfully',
        data: {
          bookId,
          imageCount: (updated as any)?.images?.length || 0,
          filename: file.originalname,
          size: file.size,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Upload book image failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // ─── Get Book Image by Index ───────────────────────
  async getBookImage(bookId: string, imageIndex: number = 0) {
    try {
      const book = await this.bookModel.findById(bookId).exec();
      if (!book) throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);

      const images = (book as any).images || [];
      if (images.length === 0) throw new NotFoundException('No images found for this book');
      if (imageIndex >= images.length) throw new NotFoundException('Image not found at given index');

      const image = images[imageIndex];
      return {
        data: image.data,
        mimetype: image.mimetype || 'image/jpeg',
        filename: image.filename || 'image',
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Get book image failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // ─── Delete Book Image by Index ────────────────────
  async deleteBookImage(bookId: string, imageIndex: number, userId: string) {
    try {
      const book = await this.booksRepository.findById(bookId);
      if (!book) throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);

      if (book.createdBySellerId?.toString() !== userId) {
        const user = await this.userModel.findById(userId).exec();
        if (user?.role !== Role.ADMIN) throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
      }

      const images = (book as any).images || [];
      if (imageIndex >= images.length) throw new NotFoundException('Image not found');

      const imageId = images[imageIndex]._id;
      await this.bookModel.findByIdAndUpdate(
        bookId,
        { $pull: { images: { _id: imageId } } },
      ).exec();

      this.logger.log(`Image deleted from book: ${book.title}`, 'Books');

      return { success: true, message: 'Book image deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Delete book image failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
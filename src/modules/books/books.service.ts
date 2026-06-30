import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { basename, join } from 'path';
import { BooksRepository } from './books.repository';
import { Book } from './schemas/book.schema';
import { User } from '../users/schemas/user.schema';
import { Seller } from '../sellers/schemas/seller.schema';
import { Role } from '../../common/enums/role.enum';
import { SellerStatus } from '../../common/enums/seller-status.enum';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    private readonly booksRepository: BooksRepository,
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
  ) {}

  private async findSellerFromAuthId(authId: string): Promise<Seller | null> {
    if (!Types.ObjectId.isValid(authId)) return null;

    const objectId = new Types.ObjectId(authId);

    const byUserId = await this.sellerModel.findOne({ userId: objectId }).exec();
    if (byUserId) return byUserId;

    return this.sellerModel.findById(objectId).exec();
  }

  private getMimeTypeFromFilename(filename: string): string {
    const lower = filename.toLowerCase();

    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';

    return 'application/octet-stream';
  }

  async create(data: any, userId: string, file?: Express.Multer.File) {
    try {
      const seller = await this.findSellerFromAuthId(userId);

      if (!seller) {
        throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);
      }

      if (seller.status !== SellerStatus.APPROVED) {
        throw new ForbiddenException(ERROR_MESSAGES.SELLER_NOT_APPROVED);
      }

      const isbn = String(data.isbn || '').trim();

      const existing = await this.booksRepository.findByIsbn(isbn);
      if (existing) {
        throw new ConflictException(ERROR_MESSAGES.ISBN_ALREADY_EXISTS);
      }

      const coverImagePath = file
        ? `/uploads/books/${file.filename}`
        : String(data.coverImage || '').trim();

      const payload: Record<string, any> = {
        isbn,
        title: String(data.title || '').trim(),
        author: String(data.author || '').trim(),
        publisher: String(data.publisher || '').trim(),
        description: String(data.description || '').trim(),
        coverImage: coverImagePath,

        /**
         * Store userId here because image permission checks compare with JWT user.sub.
         */
        createdBySellerId: new Types.ObjectId(userId),
      };

      if (data.category && Types.ObjectId.isValid(data.category)) {
        payload.category = new Types.ObjectId(data.category);
      }

      const book = await this.booksRepository.create(payload);

      this.logger.log(`Book requested: ${book.title} by seller ${(seller as any)._id}`, 'Books');

      return {
        success: true,
        message: SUCCESS_MESSAGES.BOOK_CREATED,
        data: book,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(
        `Create book failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async findById(id: string) {
    try {
      const book = await this.booksRepository.findById(id);

      if (!book) {
        throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);
      }

      return {
        success: true,
        message: SUCCESS_MESSAGES.BOOK_FETCHED,
        data: book,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(
        `Find book failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async getApprovedBooks() {
    try {
      const { data } = await this.booksRepository.findAll(
        { status: 'APPROVED' as any },
        1,
        1000,
      );

      return {
        success: true,
        message: SUCCESS_MESSAGES.BOOKS_FETCHED,
        data,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(
        `Get approved books failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async getBestSellers(limit = 8) {
    try {
      const data = await this.booksRepository.findBestSellers(limit);

      return {
        success: true,
        message: SUCCESS_MESSAGES.BOOKS_FETCHED,
        data,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(
        `Get best sellers failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

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
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(
        `Get customer books failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async uploadBookImage(bookId: string, file: Express.Multer.File, userId: string) {
    try {
      const book = await this.booksRepository.findById(bookId);

      if (!book) {
        throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);
      }

      if (book.createdBySellerId?.toString() !== userId) {
        const user = await this.userModel.findById(userId).exec();

        if (user?.role !== Role.ADMIN) {
          throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
        }
      }

      const coverImagePath = `/uploads/books/${file.filename}`;

      const updated = await this.bookModel
        .findByIdAndUpdate(
          bookId,
          {
            coverImage: coverImagePath,
          },
          { new: true },
        )
        .exec();

      this.logger.log(`Cover image uploaded for book: ${book.title}`, 'Books');

      return {
        success: true,
        message: 'Book cover image uploaded successfully',
        data: {
          bookId,
          coverImage: coverImagePath,
          filename: file.filename,
          size: file.size,
          book: updated,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(
        `Upload book image failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async getBookImage(bookId: string, imageIndex: number = 0) {
    try {
      const book = await this.bookModel.findById(bookId).exec();

      if (!book) {
        throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);
      }

      /**
       * Legacy support: old MongoDB binary images.
       */
      const images = (book as any).images || [];

      if (images.length > 0) {
        if (imageIndex >= images.length) {
          throw new NotFoundException('Image not found at given index');
        }

        const image = images[imageIndex];

        return {
          data: image.data,
          mimetype: image.mimetype || 'image/jpeg',
          filename: image.filename || 'image',
        };
      }

      /**
       * New support: disk-stored coverImage path.
       */
      const coverImage = (book as any).coverImage as string | undefined;

      if (!coverImage) {
        throw new NotFoundException('No images found for this book');
      }

      const relativePath = coverImage.startsWith('/') ? coverImage.slice(1) : coverImage;
      const filePath = join(process.cwd(), relativePath);

      if (!existsSync(filePath)) {
        throw new NotFoundException('Image file not found on server');
      }

      return {
        data: readFileSync(filePath),
        mimetype: this.getMimeTypeFromFilename(filePath),
        filename: basename(filePath),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(
        `Get book image failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async deleteBookImage(bookId: string, imageIndex: number, userId: string) {
    try {
      const book = await this.booksRepository.findById(bookId);

      if (!book) {
        throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);
      }

      if (book.createdBySellerId?.toString() !== userId) {
        const user = await this.userModel.findById(userId).exec();

        if (user?.role !== Role.ADMIN) {
          throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
        }
      }

      /**
       * Legacy support: old MongoDB binary images.
       */
      const images = (book as any).images || [];

      if (images.length > 0) {
        if (imageIndex >= images.length) {
          throw new NotFoundException('Image not found');
        }

        const imageId = images[imageIndex]._id;

        await this.bookModel
          .findByIdAndUpdate(bookId, {
            $pull: { images: { _id: imageId } },
          })
          .exec();

        return {
          success: true,
          message: 'Book image deleted successfully',
        };
      }

      /**
       * New support: disk-stored coverImage path.
       */
      const coverImage = (book as any).coverImage as string | undefined;

      if (!coverImage) {
        throw new NotFoundException('No image found');
      }

      const relativePath = coverImage.startsWith('/') ? coverImage.slice(1) : coverImage;
      const filePath = join(process.cwd(), relativePath);

      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }

      await this.bookModel
        .findByIdAndUpdate(bookId, {
          $unset: { coverImage: '' },
        })
        .exec();

      this.logger.log(`Cover image deleted from book: ${book.title}`, 'Books');

      return {
        success: true,
        message: 'Book image deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(
        `Delete book image failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }
}
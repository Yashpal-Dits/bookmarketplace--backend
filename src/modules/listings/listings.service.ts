import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ListingsRepository } from './listings.repository';
import { Book } from '../books/schemas/book.schema';
import { Seller } from '../sellers/schemas/seller.schema';
import { SellerStatus } from '../../common/enums/seller-status.enum';
import { BookStatus } from '../../common/enums/book-status.enum';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import type { CreateListingPayload, UpdateListingPayload } from './interfaces/listing.interface';

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    private readonly listingsRepository: ListingsRepository,
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
  ) {}

  private async findSellerFromAuthId(authId: string): Promise<Seller | null> {
    if (!Types.ObjectId.isValid(authId)) return null;

    const objectId = new Types.ObjectId(authId);

    /**
     * Normal case:
     * JWT sub = User._id
     * Seller.userId = User._id
     */
    const byUserId = await this.sellerModel.findOne({ userId: objectId }).exec();
    if (byUserId) return byUserId;

    /**
     * Fallback:
     * In case frontend/session accidentally passes seller id.
     */
    return this.sellerModel.findById(objectId).exec();
  }

  async create(payload: CreateListingPayload, userId: string) {
    try {
      const seller = await this.findSellerFromAuthId(userId);

      if (!seller) {
        throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);
      }

      if (seller.status !== SellerStatus.APPROVED) {
        throw new ForbiddenException(ERROR_MESSAGES.SELLER_NOT_APPROVED);
      }

      if (!Types.ObjectId.isValid(payload.bookId)) {
        throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);
      }

      const book = await this.bookModel.findById(payload.bookId).exec();

      if (!book) {
        throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);
      }

      if (book.status !== BookStatus.APPROVED) {
        throw new ForbiddenException(ERROR_MESSAGES.BOOK_NOT_APPROVED);
      }

      const existing = await this.listingsRepository.findByBookAndSeller(
        payload.bookId,
        seller._id.toString(),
      );

      if (existing) {
        throw new ConflictException(ERROR_MESSAGES.LISTING_ALREADY_EXISTS);
      }

      const listing = await this.listingsRepository.create({
        bookId: new Types.ObjectId(payload.bookId),
        sellerId: new Types.ObjectId(seller._id.toString()),
        price: Number(payload.price),
        mrp: Number(payload.mrp),
        stock: Number(payload.stock),
        isActive: true,
      });

      await this.syncBookAggregates(payload.bookId);

      return {
        success: true,
        message: SUCCESS_MESSAGES.LISTING_CREATED,
        data: listing,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(
        `Create listing failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async getMyListings(userId: string) {
    try {
      const seller = await this.findSellerFromAuthId(userId);

      if (!seller) {
        throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);
      }

      const listings = await this.listingsRepository.findBySeller(seller._id.toString());

      return {
        success: true,
        message: SUCCESS_MESSAGES.LISTINGS_FETCHED,
        data: listings,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(
        `Get listings failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async getListingsByBookId(bookId: string) {
    try {
      const listings = await this.listingsRepository.findByBookId(bookId);

      return {
        success: true,
        message: SUCCESS_MESSAGES.LISTINGS_FETCHED,
        data: listings,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(
        `Get listings by book failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  async updateListing(listingId: string, payload: UpdateListingPayload, userId: string) {
    try {
      const seller = await this.findSellerFromAuthId(userId);

      if (!seller) {
        throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);
      }

      const listing = await this.listingsRepository.findById(listingId);

      if (!listing) {
        throw new NotFoundException(ERROR_MESSAGES.LISTING_NOT_FOUND);
      }

      if (listing.sellerId.toString() !== seller._id.toString()) {
        throw new ForbiddenException(ERROR_MESSAGES.NOT_YOUR_LISTING);
      }

      const updated = await this.listingsRepository.update(listingId, {
        price: payload.price !== undefined ? Number(payload.price) : undefined,
        mrp: payload.mrp !== undefined ? Number(payload.mrp) : undefined,
        stock: payload.stock !== undefined ? Number(payload.stock) : undefined,
        isActive: payload.isActive,
      });

      if (listing.bookId) {
        await this.syncBookAggregates(listing.bookId.toString());
      }

      return {
        success: true,
        message: SUCCESS_MESSAGES.LISTING_UPDATED,
        data: updated,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(
        `Update listing failed: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  private async syncBookAggregates(bookId: string): Promise<void> {
    const listings = await this.listingsRepository.findAll({
      bookId,
      isActive: true,
    });

    const prices = listings.map((listing) => listing.price);
    const totalStock = listings.reduce((sum, listing) => sum + listing.stock, 0);

    await this.bookModel
      .findByIdAndUpdate(bookId, {
        minPrice: prices.length > 0 ? Math.min(...prices) : null,
        mrp: prices.length > 0 ? Math.max(...listings.map((listing) => listing.mrp || listing.price)) : null,
        totalStock,
      })
      .exec();
  }
}
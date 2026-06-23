import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ListingsRepository } from './listings.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from '../books/schemas/book.schema';
import { Seller } from '../sellers/schemas/seller.schema';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import { LoggerService } from '../../common/logger/logger.service';
import { BookStatus } from '../../common/enums/book-status.enum';
import { SellerStatus } from '../../common/enums/seller-status.enum';

@Injectable()
export class ListingsService {
  constructor(
    private readonly listingsRepository: ListingsRepository,
    private readonly logger: LoggerService,
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
  ) {}

  async create(data: any, userId: string) {
    const seller = await this.sellerModel.findOne({ userId }).exec();
    if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);
    if (seller.status !== SellerStatus.APPROVED) {
      throw new ForbiddenException(ERROR_MESSAGES.SELLER_NOT_APPROVED);
    }

    const book = await this.bookModel.findById(data.bookId).exec();
    if (!book) throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);
    if (book.status !== BookStatus.APPROVED) {
      throw new ForbiddenException(ERROR_MESSAGES.BOOK_NOT_APPROVED);
    }

    const existing = await this.listingsRepository.findByBookAndSeller(data.bookId, seller._id.toString());
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.LISTING_ALREADY_EXISTS);
    }

    const listing = await this.listingsRepository.create({
      bookId: data.bookId,
      sellerId: seller._id,
      price: data.price,
      mrp: data.mrp,
      stock: data.stock,
      isActive: true,
    });

    // Sync book aggregates
    await this.syncBookAggregates(data.bookId);

    this.logger.log(`Listing created: ${book.title} by ${seller.businessName}`, 'Listings');

    return { success: true, message: SUCCESS_MESSAGES.LISTING_CREATED, data: listing };
  }

  async getMyListings(userId: string) {
    const seller = await this.sellerModel.findOne({ userId }).exec();
    if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);

    const listings = await this.listingsRepository.findBySeller(seller._id.toString());
    return { success: true, message: SUCCESS_MESSAGES.LISTINGS_FETCHED, data: listings };
  }

  async getListingsByBookId(bookId: string) {
    const listings = await this.listingsRepository.findByBookId(bookId);
    return { success: true, message: SUCCESS_MESSAGES.LISTINGS_FETCHED, data: listings };
  }

  async updateListing(listingId: string, data: any, userId: string) {
    const seller = await this.sellerModel.findOne({ userId }).exec();
    if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);

    const listing = await this.listingsRepository.findById(listingId);
    if (!listing) throw new NotFoundException(ERROR_MESSAGES.LISTING_NOT_FOUND);
    if (listing.sellerId.toString() !== seller._id.toString()) {
      throw new ForbiddenException(ERROR_MESSAGES.NOT_YOUR_LISTING);
    }

    const updated = await this.listingsRepository.update(listingId, {
      price: data.price,
      mrp: data.mrp,
      stock: data.stock,
      isActive: data.isActive,
    });

    if (listing.bookId) {
      await this.syncBookAggregates(listing.bookId.toString());
    }

    return { success: true, message: SUCCESS_MESSAGES.LISTING_UPDATED, data: updated };
  }

  private async syncBookAggregates(bookId: string): Promise<void> {
    const listings = await this.listingsRepository.findAll({ bookId, isActive: true });
    const prices = listings.map((l) => l.price);
    const totalStock = listings.reduce((sum, l) => sum + l.stock, 0);

    await this.bookModel.findByIdAndUpdate(bookId, {
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      mrp: prices.length > 0 ? prices[0] : null,
      totalStock,
    });
  }
}
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seller } from '../sellers/schemas/seller.schema';
import { Customer } from '../customers/schemas/customer.schema';
import { Book } from '../books/schemas/book.schema';
import { Listing } from '../listings/schemas/listing.schema';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../common/constants/messages.constant';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    @InjectModel(Listing.name) private readonly listingModel: Model<Listing>,
  ) {}

//----- DASHBOARD-------

  async getDashboardSummary() {
    try {
      const [sellers, customers, books, listings] = await Promise.all([
        this.sellerModel.find().exec(),
        this.customerModel.find().exec(),
        this.bookModel.find().exec(),
        this.listingModel.find().exec(),
      ]);

      return {
        success: true,
        message: SUCCESS_MESSAGES.DASHBOARD_FETCHED,
        data: {
          totalSellers: sellers.length,
          pendingSellers: sellers.filter(s => s.status === 'PENDING').length,
          approvedSellers: sellers.filter(s => s.status === 'APPROVED').length,
          rejectedSellers: sellers.filter(s => s.status === 'REJECTED').length,
          totalCustomers: customers.length,
          totalBooks: books.length,
          pendingBooks: books.filter(b => b.status === 'PENDING').length,
          approvedBooks: books.filter(b => b.status === 'APPROVED').length,
          rejectedBooks: books.filter(b => b.status === 'REJECTED').length,
          totalListings: listings.length,
          activeListings: listings.filter(l => l.isActive).length,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Dashboard failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // ------ SELLERS -----

  async getSellers(page = 1, limit = 10, status?: string) {
    try {
      const filter: Record<string, any> = {};
      if (status) filter.status = status;

      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.sellerModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        this.sellerModel.countDocuments(filter).exec(),
      ]);

      return {
        success: true,
        message: SUCCESS_MESSAGES.SELLER_FETCHED,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Get sellers failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async updateSellerStatus(sellerId: string, status: string) {

    try {

      const seller = await this.sellerModel.findByIdAndUpdate(sellerId, { status }, { new: true }).exec();

      if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);

      const message = status === 'APPROVED' ? SUCCESS_MESSAGES.SELLER_APPROVED : SUCCESS_MESSAGES.SELLER_REJECTED;
      this.logger.log(`Seller ${seller.businessName} → ${status}`);

      return { success: true, message, data: seller };
      
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Update seller status failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // -------BOOKS-------

  async getBooks(page = 1, limit = 10, status?: string) {

    try {
      const filter: Record<string, any> = {};
      if (status) filter.status = status;

      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.bookModel.find(filter).populate('category', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        this.bookModel.countDocuments(filter).exec(),
      ]);

      return {
        success: true,
        message: SUCCESS_MESSAGES.BOOKS_FETCHED,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Get books failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async updateBookStatus(bookId: string, status: string) {

    try {

      const book = await this.bookModel.findByIdAndUpdate(bookId, { status }, { new: true }).exec();

      if (!book) throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);

      const message = status === 'APPROVED' ? SUCCESS_MESSAGES.BOOK_APPROVED : SUCCESS_MESSAGES.BOOK_REJECTED;
      this.logger.log(`Book ${book.title} → ${status}`);

      return { success: true, message, data: book };
    } catch (error) {

      if (error instanceof NotFoundException) throw error;

      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Update book status failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async updateBookCatalog(bookId: string, data: any) {

    try {
      const book = await this.bookModel.findByIdAndUpdate(bookId, data, { new: true }).exec();

      if (!book) throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);

      this.logger.log(`Book catalog updated: ${book.title}`);
      return { success: true, message: SUCCESS_MESSAGES.BOOK_UPDATED, data: book };

    } catch (error) {

      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Update book catalog failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async deleteBook(bookId: string) {

    try {
      const book = await this.bookModel.findByIdAndDelete(bookId).exec();

      if (!book) throw new NotFoundException(ERROR_MESSAGES.BOOK_NOT_FOUND);

      this.logger.log(`Book deleted: ${book.title}`);
      return { success: true, message: SUCCESS_MESSAGES.BOOK_DELETED };

    } catch (error) {

      if (error instanceof NotFoundException) throw error;

      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Delete book failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // ---------CUSTOMERS -------------

  async getCustomers(page = 1, limit = 10, status?: string) {

    try {
      const filter: Record<string, any> = {};
      if (status) filter.status = status;

      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.customerModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        this.customerModel.countDocuments(filter).exec(),
      ]);

      return {
        success: true,
        message: SUCCESS_MESSAGES.CUSTOMER_FETCHED,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Get customers failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async updateCustomerStatus(customerId: string, status: string) {

    try {
      const customer = await this.customerModel.findByIdAndUpdate(customerId, { status }, { new: true }).exec();

      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      this.logger.log(`Customer ${customer.email} → ${status}`);

      return { success: true, message: SUCCESS_MESSAGES.CUSTOMER_UPDATED, data: customer };

    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      const msg = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Update customer status failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
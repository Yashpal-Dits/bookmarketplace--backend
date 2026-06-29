import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CartRepository } from './cart.repository';
import { Customer } from '../customers/schemas/customer.schema';
import { Listing } from '../listings/schemas/listing.schema';
import { Book } from '../books/schemas/book.schema';
import { Seller } from '../sellers/schemas/seller.schema';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import type { CartItemResponse } from './interfaces/cart.interface';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
    @InjectModel(Listing.name) private readonly listingModel: Model<Listing>,
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
  ) {}

  private async getOrCreateCart(customerId: string) {
    let cart = await this.cartRepository.findCartByCustomer(customerId);
    if (!cart) cart = await this.cartRepository.createCart(customerId);
    return cart;
  }

  async getCart(userId: string) {
    try {
      const customer = await this.customerModel.findOne({ userId }).exec();
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      const cart = await this.getOrCreateCart(customer._id.toString());
      const items = await this.cartRepository.findCartItems(cart._id.toString());

      const data: CartItemResponse[] = [];
      for (const item of items) {
        const listing = await this.listingModel.findById(item.listingId).exec();
        if (!listing) continue;

        const book = await this.bookModel.findById(listing.bookId).exec();
        const seller = await this.sellerModel.findById(listing.sellerId).exec();

        data.push({
          _id: item._id.toString(),
          listingId: item.listingId.toString(),
          quantity: item.quantity,
          listing: {
            price: listing.price,
            mrp: listing.mrp,
            stock: listing.stock,
            isActive: listing.isActive,
          },
          book: book
            ? {
                _id: book._id.toString(),
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                category: (book as any).category,
              }
            : null,
          seller: seller
            ? {
                _id: seller._id.toString(),
                businessName: seller.businessName,
                storeLogo: seller.storeLogo,
              }
            : null,
        });
      }

      return { success: true, message: 'Cart fetched successfully', data };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Get cart failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async addToCart(userId: string, payload: { listingId: string; quantity: number }) {
    try {
      const customer = await this.customerModel.findOne({ userId }).exec();
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      const listing = await this.listingModel.findById(payload.listingId).exec();
      if (!listing) throw new NotFoundException(ERROR_MESSAGES.LISTING_NOT_FOUND);
      if (!listing.isActive) throw new BadRequestException(ERROR_MESSAGES.LISTING_NOT_ACTIVE);
      if (listing.stock <= 0) throw new BadRequestException(ERROR_MESSAGES.LISTING_OUT_OF_STOCK);

      const cart = await this.getOrCreateCart(customer._id.toString());
      const existing = await this.cartRepository.findCartItemByListing(cart._id.toString(), payload.listingId);
      const requestedTotal = (existing?.quantity || 0) + payload.quantity;

      if (requestedTotal > listing.stock) {
        const msg = existing
          ? `Only ${listing.stock} in stock — you already have ${existing.quantity} in your cart`
          : `Only ${listing.stock} left in stock`;
        throw new BadRequestException(msg);
      }

      let cartItem;
      if (existing) {
        cartItem = await this.cartRepository.updateQuantity(existing._id.toString(), requestedTotal);
      } else {
        cartItem = await this.cartRepository.addCartItem(cart._id.toString(), payload.listingId, payload.quantity);
      }

      return { success: true, message: SUCCESS_MESSAGES.CART_ITEM_ADDED, data: cartItem };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Add to cart failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async updateQuantity(userId: string, itemId: string, payload: { quantity: number }) {
    try {
      if (payload.quantity < 1) throw new BadRequestException(ERROR_MESSAGES.QUANTITY_MIN);

      const customer = await this.customerModel.findOne({ userId }).exec();
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      const cart = await this.getOrCreateCart(customer._id.toString());
      const items = await this.cartRepository.findCartItems(cart._id.toString());
      const item = items.find(i => i._id.toString() === itemId);
      if (!item) throw new NotFoundException(ERROR_MESSAGES.CART_ITEM_NOT_FOUND);

      const listing = await this.listingModel.findById(item.listingId).exec();
      if (!listing) throw new NotFoundException(ERROR_MESSAGES.LISTING_NOT_FOUND);
      if (payload.quantity > listing.stock) throw new BadRequestException(`Only ${listing.stock} left in stock`);

      const updated = await this.cartRepository.updateQuantity(itemId, payload.quantity);
      return { success: true, message: SUCCESS_MESSAGES.CART_ITEM_UPDATED, data: updated };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Update quantity failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async removeItem(userId: string, itemId: string) {
    try {
      const customer = await this.customerModel.findOne({ userId }).exec();
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      const cart = await this.getOrCreateCart(customer._id.toString());
      const items = await this.cartRepository.findCartItems(cart._id.toString());
      const item = items.find(i => i._id.toString() === itemId);
      if (!item) throw new NotFoundException(ERROR_MESSAGES.CART_ITEM_NOT_FOUND);

      await this.cartRepository.removeCartItem(itemId);
      return { success: true, message: SUCCESS_MESSAGES.CART_ITEM_REMOVED };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Remove item failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async clearCart(userId: string) {
    try {
      const customer = await this.customerModel.findOne({ userId }).exec();
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      const cart = await this.getOrCreateCart(customer._id.toString());
      await this.cartRepository.clearCart(cart._id.toString());
      return { success: true, message: SUCCESS_MESSAGES.CART_CLEARED };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Clear cart failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
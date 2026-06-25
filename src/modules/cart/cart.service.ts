import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CartRepository } from './cart.repository';
import { Cart } from './schemas/cart.schema';
import { Customer } from '../customers/schemas/customer.schema';
import { Listing } from '../listings/schemas/listing.schema';
import { Book } from '../books/schemas/book.schema';
import { Seller } from '../sellers/schemas/seller.schema';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import { CartItemResponse } from './interfaces/cart-response.interface';


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

  private async getOrCreateCart(customerId: string): Promise<Cart> {
    let cart = await this.cartRepository.findCartByCustomer(customerId);
    if (!cart) {
      cart = await this.cartRepository.createCart(customerId);
      this.logger.log(`New cart created for customer: ${customerId}`);
    }
    return cart;
  }

  // GET /customer/cart
  async getCart(userId: string) {
    try {
      const customer = await this.customerModel.findOne({ userId }).exec();
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      const cart = await this.getOrCreateCart(customer._id.toString());
      const items = await this.cartRepository.findCartItems(cart._id.toString());

      // Enrich cart items with listing, book, seller details
      const detailedItems: CartItemResponse[] = [];
      for (const item of items) {
        const listing = await this.listingModel.findById(item.listingId).exec();
        if (!listing) continue;

        const book = await this.bookModel.findById(listing.bookId).populate('category', 'name').exec();
        const seller = await this.sellerModel.findById(listing.sellerId).exec();

        detailedItems.push({
          _id: item._id,
          listingId: item.listingId,
          quantity: item.quantity,
          listing: {
            price: listing.price,
            mrp: listing.mrp,
            stock: listing.stock,
            isActive: listing.isActive,
          },
          book: book ? {
            _id: book._id,
            title: book.title,
            author: book.author,
            coverImage: book.coverImage,
            isbn: book.isbn,
            category: (book as any).category,
          } : null,
          seller: seller ? {
            _id: seller._id,
            businessName: seller.businessName,
            storeLogo: seller.storeLogo,
          } : null,
        });
      }

      return {
        success: true,
        message: 'Cart fetched successfully',
        data: detailedItems,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Get cart failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // POST /customer/cart/add
  async addToCart(userId: string, listingId: string, quantity: number) {
    try {
      // Validate customer
      const customer = await this.customerModel.findOne({ userId }).exec();
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      // Validate listing
      const listing = await this.listingModel.findById(listingId).exec();
      if (!listing) throw new NotFoundException(ERROR_MESSAGES.LISTING_NOT_FOUND);
      if (!listing.isActive) throw new BadRequestException(ERROR_MESSAGES.LISTING_NOT_ACTIVE);
      if (listing.stock <= 0) throw new BadRequestException(ERROR_MESSAGES.LISTING_OUT_OF_STOCK);

      // Get or create cart
      const cart = await this.getOrCreateCart(customer._id.toString());

      // Check if item already in cart
      const existing = await this.cartRepository.findCartItemByListing(cart._id.toString(), listingId);
      const requestedTotal = (existing?.quantity || 0) + quantity;

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
        cartItem = await this.cartRepository.addCartItem(cart._id.toString(), listingId, quantity);
      }

      this.logger.log(`Item added to cart: ${listingId} x${quantity}`);

      return { success: true, message: SUCCESS_MESSAGES.CART_ITEM_ADDED, data: cartItem };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Add to cart failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // PATCH /customer/cart/item/:id
  async updateQuantity(userId: string, itemId: string, quantity: number) {
    try {
      if (quantity < 1) throw new BadRequestException(ERROR_MESSAGES.QUANTITY_MIN);

      const customer = await this.customerModel.findOne({ userId }).exec();
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      const cart = await this.getOrCreateCart(customer._id.toString());

      // Find item in user's cart
      const items = await this.cartRepository.findCartItems(cart._id.toString());
      const item = items.find(i => i._id.toString() === itemId);
      if (!item) throw new NotFoundException(ERROR_MESSAGES.CART_ITEM_NOT_FOUND);

      // Check stock
      const listing = await this.listingModel.findById(item.listingId).exec();
      if (!listing) throw new NotFoundException(ERROR_MESSAGES.LISTING_NOT_FOUND);
      if (quantity > listing.stock) {
        throw new BadRequestException(`Only ${listing.stock} left in stock`);
      }

      const updated = await this.cartRepository.updateQuantity(itemId, quantity);

      return { success: true, message: SUCCESS_MESSAGES.CART_ITEM_UPDATED, data: updated };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Update quantity failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  // DELETE /customer/cart/item/:id
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

  // DELETE /customer/cart/clear
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
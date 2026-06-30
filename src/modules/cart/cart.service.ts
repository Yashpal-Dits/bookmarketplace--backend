import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { CartRepository } from './cart.repository';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponse } from './interfaces/cart.interface';

import { Listing } from '../listings/schemas/listing.schema';
import { Book } from '../books/schemas/book.schema';
import { Seller } from '../sellers/schemas/seller.schema';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    @InjectModel(Listing.name) private readonly listingModel: Model<Listing>,
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
  ) {}

  async addToCart(customerId: string, dto: AddToCartDto) {
    const { listingId, quantity } = dto;

    if (!Types.ObjectId.isValid(listingId)) {
      throw new BadRequestException('Invalid listing id.');
    }

    const listing = await this.listingModel.findById(listingId).exec();

    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }

    const requestedQuantity = quantity ?? 1;

    if (!(listing as any).isActive) {
      throw new BadRequestException('This listing is not active.');
    }

    if ((listing as any).stock < requestedQuantity) {
      throw new BadRequestException('Requested quantity exceeds available stock.');
    }

    let cart = await this.cartRepository.findCartByCustomer(customerId);

    if (!cart) {
      cart = await this.cartRepository.createCart(customerId);
    }

    const existingItem = await this.cartRepository.findCartItemByListing(
      cart._id.toString(),
      listingId,
    );

    if (existingItem) {
      const nextQuantity = existingItem.quantity + requestedQuantity;

      if ((listing as any).stock < nextQuantity) {
        throw new BadRequestException('Requested quantity exceeds available stock.');
      }

      await this.cartRepository.updateQuantity(
        existingItem._id.toString(),
        nextQuantity,
      );
    } else {
      await this.cartRepository.addCartItem(
        cart._id.toString(),
        listingId,
        requestedQuantity,
      );
    }

    const updatedCart = await this.getCart(customerId);

    return {
      success: true,
      message: 'Item added to cart successfully.',
      data: updatedCart,
    };
  }

  async getCart(customerId: string): Promise<CartResponse> {
    const cart = await this.cartRepository.findCartByCustomer(customerId);

    if (!cart) {
      return {
        _id: '',
        customerId,
        items: [],
        totalItems: 0,
        subtotal: 0,
        createdAt: undefined,
        updatedAt: undefined,
      };
    }

    const cartItems = await this.cartRepository.findCartItems(cart._id.toString());

    const items = await Promise.all(
      cartItems.map(async (item) => {
        const listing = await this.listingModel.findById(item.listingId).exec();

        const book =
          listing && (listing as any).bookId
            ? await this.bookModel.findById((listing as any).bookId).exec()
            : null;

        const seller =
          listing && (listing as any).sellerId
            ? await this.sellerModel.findById((listing as any).sellerId).exec()
            : null;

        return {
          _id: item._id?.toString() ?? '',
          quantity: item.quantity,
          book: book
            ? {
                _id: book._id.toString(),
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                description: (book as any).description,
                publisher: (book as any).publisher,
                coverImage: (book as any).coverImage,
                category: (book as any).category,
                status: (book as any).status,
                rating: (book as any).rating,
                minPrice: (book as any).minPrice,
                mrp: (book as any).mrp,
                totalStock: (book as any).totalStock,
                createdAt: (book as any).createdAt,
                updatedAt: (book as any).updatedAt,
              }
            : null,
          listing: listing
            ? {
                _id: listing._id.toString(),
                price: (listing as any).price,
                originalPrice: (listing as any).originalPrice,
                mrp: (listing as any).mrp,
                discountPercent: (listing as any).discountPercent,
                condition: (listing as any).condition,
                format: (listing as any).format,
                stock: (listing as any).stock,
                sellerId: (listing as any).sellerId?.toString(),
                isActive: (listing as any).isActive,
                createdAt: (listing as any).createdAt,
                updatedAt: (listing as any).updatedAt,
              }
            : null,
          seller: seller
            ? {
                _id: seller._id.toString(),
                userId: (seller as any).userId?.toString(),
                businessName: (seller as any).businessName,
                contactPerson: (seller as any).contactPerson,
                email: (seller as any).email,
                mobileNumber: (seller as any).mobileNumber,
                status: (seller as any).status,
                storeLogo: (seller as any).storeLogo,
                createdAt: (seller as any).createdAt,
                updatedAt: (seller as any).updatedAt,
              }
            : null,
        };
      }),
    );

    const validItems = items.filter((item) => item.listing);

    const subtotal = validItems.reduce((sum, item) => {
      const price = item.listing?.price ?? 0;
      return sum + price * item.quantity;
    }, 0);

    const totalItems = validItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      _id: cart._id.toString(),
      customerId: cart.customerId.toString(),
      items: validItems,
      totalItems,
      subtotal,
      createdAt: (cart as any).createdAt,
      updatedAt: (cart as any).updatedAt,
    };
  }

  async updateQuantity(
    customerId: string,
    cartItemId: string,
    dto: UpdateCartItemDto,
  ) {
    if (!Types.ObjectId.isValid(cartItemId)) {
      throw new BadRequestException('Invalid cart item id.');
    }

    const cart = await this.cartRepository.findCartByCustomer(customerId);

    if (!cart) {
      throw new NotFoundException('Cart not found.');
    }

    const cartItems = await this.cartRepository.findCartItems(cart._id.toString());

    const item = cartItems.find((cartItem) => cartItem._id?.toString() === cartItemId);

    if (!item) {
      throw new NotFoundException('Cart item not found.');
    }

    const listing = await this.listingModel.findById(item.listingId).exec();

    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }

    if (dto.quantity <= 0) {
      await this.cartRepository.removeCartItem(cartItemId);
    } else {
      if ((listing as any).stock < dto.quantity) {
        throw new BadRequestException('Requested quantity exceeds available stock.');
      }

      await this.cartRepository.updateQuantity(cartItemId, dto.quantity);
    }

    const updatedCart = await this.getCart(customerId);

    return {
      success: true,
      message: 'Cart updated successfully.',
      data: updatedCart,
    };
  }

  async removeItem(customerId: string, cartItemId: string) {
    if (!Types.ObjectId.isValid(cartItemId)) {
      throw new BadRequestException('Invalid cart item id.');
    }

    const cart = await this.cartRepository.findCartByCustomer(customerId);

    if (!cart) {
      throw new NotFoundException('Cart not found.');
    }

    const cartItems = await this.cartRepository.findCartItems(cart._id.toString());

    const item = cartItems.find((cartItem) => cartItem._id?.toString() === cartItemId);

    if (!item) {
      throw new NotFoundException('Cart item not found.');
    }

    await this.cartRepository.removeCartItem(cartItemId);

    const updatedCart = await this.getCart(customerId);

    return {
      success: true,
      message: 'Item removed from cart successfully.',
      data: updatedCart,
    };
  }

  async clearCart(customerId: string) {
    const cart = await this.cartRepository.findCartByCustomer(customerId);

    if (!cart) {
      return {
        success: true,
        message: 'Cart cleared successfully.',
        data: {
          _id: '',
          customerId,
          items: [],
          totalItems: 0,
          subtotal: 0,
          createdAt: undefined,
          updatedAt: undefined,
        },
      };
    }

    await this.cartRepository.clearCart(cart._id.toString());

    return {
      success: true,
      message: 'Cart cleared successfully.',
      data: await this.getCart(customerId),
    };
  }
}
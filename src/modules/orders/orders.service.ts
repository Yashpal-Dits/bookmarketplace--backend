import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Connection } from 'mongoose';
import { OrdersRepository } from './orders.repository';
import { CartRepository } from '../cart/cart.repository';
import { Listing } from '../listings/schemas/listing.schema';
import { Book } from '../books/schemas/book.schema';
import { Seller } from '../sellers/schemas/seller.schema';
import { Customer } from '../customers/schemas/customer.schema';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import { OrderStatus } from '../../common/enums/order-status.enum';
import type { PlaceOrderPayload, OrderDetailed, OrderItemDetailed } from './interfaces/order.interface';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly cartRepository: CartRepository,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Listing.name) private readonly listingModel: Model<Listing>,
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
  ) { }

  async placeOrder(userId: string, payload: PlaceOrderPayload) {
    try {
      const customer = await this.customerModel.findOne({ userId }).exec();
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      const cart = await this.cartRepository.findCartByCustomer(customer._id.toString());
      if (!cart) throw new BadRequestException(ERROR_MESSAGES.CART_EMPTY);

      const cartItems = await this.cartRepository.findCartItems(cart._id.toString());
      if (cartItems.length === 0) throw new BadRequestException(ERROR_MESSAGES.CART_EMPTY);

      // Validate stock for all items
      for (const item of cartItems) {
        const listing = await this.listingModel.findById(item.listingId).exec();
        if (!listing || !listing.isActive) {
          throw new BadRequestException('Some items in your cart are no longer available.');
        }
        if (item.quantity > listing.stock) {
          throw new BadRequestException(
            `Only ${listing.stock} left in stock. Please update your cart.`,
          );
        }
      }

      const session = await this.connection.startSession();
      session.startTransaction();

      try {
        let totalAmount = 0;
        const orderItemsData: any[] = [];

        // Create order items data and deduct stock
        for (const item of cartItems) {
          const listing = await this.listingModel.findById(item.listingId).session(session).exec();
          if (!listing) throw new NotFoundException(ERROR_MESSAGES.LISTING_NOT_FOUND);

          const book = await this.bookModel.findById(listing.bookId).session(session).exec();
          const seller = await this.sellerModel.findById(listing.sellerId).session(session).exec();
          if (!book || !seller) continue;

          const subtotal = listing.price * item.quantity;
          totalAmount += subtotal;

          orderItemsData.push({
            listingId: listing._id,
            bookId: book._id,
            sellerId: seller._id,
            bookTitle: book.title,
            sellerName: seller.businessName,
            priceAtPurchase: listing.price,
            quantity: item.quantity,
            subtotal,
            coverImage:'',
            status: OrderStatus.CREATED,
          });

          // Deduct stock
          await this.listingModel.findByIdAndUpdate(
            listing._id,
            { $inc: { stock: -item.quantity } },
            { session, new: true },
          ).exec();
        }

        // Create the order
        const [order] = await this.connection.model('Order').create(
          [{
            customerId: customer._id,
            shippingAddress: payload.shippingAddress,
            totalAmount,
            status: OrderStatus.CREATED,
          }],
          { session },
        );

        // Create order items with orderId
        const orderItemsWithOrderId = orderItemsData.map((item) => ({
          ...item,
          orderId: order._id,
        }));

        await this.connection.model('OrderItem').insertMany(orderItemsWithOrderId, { session });

        // Clear the cart
        await this.cartRepository.clearCart(cart._id.toString());

        // Sync book aggregates
        for (const item of cartItems) {
          const listing = await this.listingModel.findById(item.listingId).exec();
          if (listing?.bookId) {
            await this.syncBookAggregates(listing.bookId.toString());
          }
        }

        await session.commitTransaction();

        this.logger.log(`Order placed: ${order._id} by customer ${customer._id}`, 'Orders');

        return {
          success: true,
          message: SUCCESS_MESSAGES.ORDER_CREATED,
          data: {
            order: { ...order.toObject(), items: orderItemsWithOrderId },
          },
        };
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Place order failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async getCustomerOrders(userId: string) {
    try {
      const customer = await this.customerModel.findOne({ userId }).exec();
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      const orders = await this.ordersRepository.findOrdersByCustomer(customer._id.toString());

      const data: OrderDetailed[] = await Promise.all(
        orders.map(async (order) => {
          const items = await this.ordersRepository.findOrderItems(order._id.toString());
          return { ...order.toObject(), items } as OrderDetailed;
        }),
      );

      return { success: true, message: SUCCESS_MESSAGES.ORDERS_FETCHED, data };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Get customer orders failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async getSellerOrderItems(userId: string) {
    try {
      const seller = await this.sellerModel.findOne({ userId }).exec();
      if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);

      const items = await this.ordersRepository.findOrderItemsBySeller(seller._id.toString());

      const data: OrderItemDetailed[] = await Promise.all(
        items.map(async (item) => {
          const order = await this.ordersRepository.findOrderById(item.orderId.toString());
          const customer = order ? await this.customerModel.findById(order.customerId).exec() : null;
          return { ...item.toObject(), order: order?.toObject(), customer } as OrderItemDetailed;
        }),
      );

      return { success: true, message: SUCCESS_MESSAGES.ORDERS_FETCHED, data };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Get seller orders failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async updateOrderItemStatus(orderItemId: string, status: string, userId: string) {
    try {
      const seller = await this.sellerModel.findOne({ userId }).exec();
      if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);

      const orderItem = await this.ordersRepository.findOrderItemById(orderItemId);
      if (!orderItem) throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
      if (orderItem.sellerId.toString() !== seller._id.toString()) {
        throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
      }

      const updated = await this.ordersRepository.updateOrderItemStatus(orderItemId, status as OrderStatus);

      this.logger.log(`Order item ${orderItemId} → ${status}`, 'Orders');

      return { success: true, message: SUCCESS_MESSAGES.ORDER_STATUS_UPDATED, data: updated };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Update order status failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  private async syncBookAggregates(bookId: string): Promise<void> {
    const listings = await this.listingModel.find({ bookId, isActive: true }).exec();
    const prices = listings.map(l => l.price);
    const totalStock = listings.reduce((sum, l) => sum + l.stock, 0);
    await this.bookModel.findByIdAndUpdate(bookId, {
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      totalStock,
    }).exec();
  }
  // ─── Cancel Order (Customer) ──────────────────────────
  async cancelOrder(userId: string, orderId: string) {
    try {
      const customer = await this.customerModel.findOne({ userId }).exec();
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      const order = await this.ordersRepository.findOrderById(orderId);
      if (!order) throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);

      // Check if order belongs to this customer
      if (order.customerId.toString() !== customer._id.toString()) {
        throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
      }

      // Check if order can be cancelled (only CREATED status)
      if (order.status !== OrderStatus.CREATED) {
        throw new BadRequestException(
          'Order cannot be cancelled. Only orders in "CREATED" status can be cancelled.',
        );
      }

      const session = await this.connection.startSession();
      session.startTransaction();

      try {
        // Update order status
        await this.connection.model('Order').findByIdAndUpdate(
          orderId,
          { status: OrderStatus.CANCELLED },
          { session },
        ).exec();

        // Get order items and restore stock
        const items = await this.ordersRepository.findOrderItems(orderId);

        for (const item of items) {
          // Update order item status
          await this.connection.model('OrderItem').findByIdAndUpdate(
            item._id,
            { status: OrderStatus.CANCELLED },
            { session },
          ).exec();

          // Restore stock to listing
          await this.listingModel.findByIdAndUpdate(
            item.listingId,
            { $inc: { stock: item.quantity } },
            { session, new: true },
          ).exec();

          // Sync book aggregates
          if (item.bookId) {
            const listings = await this.listingModel
              .find({ bookId: item.bookId, isActive: true })
              .session(session)
              .exec();

            const prices = listings.map(l => l.price);
            const totalStock = listings.reduce((sum, l) => sum + l.stock, 0);

            await this.bookModel.findByIdAndUpdate(
              item.bookId,
              {
                minPrice: prices.length > 0 ? Math.min(...prices) : null,
                totalStock,
              },
              { session },
            ).exec();
          }
        }

        await session.commitTransaction();

        this.logger.log(`Order cancelled: ${orderId} by customer ${customer._id}`, 'Orders');

        return { success: true, message: 'Order cancelled successfully. Stock has been restored.' };
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Cancel order failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
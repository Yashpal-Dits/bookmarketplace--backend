import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './schemas/order.schema';
import { OrderItem } from './schemas/order-item.schema';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Injectable()
export class OrdersRepository {
  private readonly logger = new Logger(OrdersRepository.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(OrderItem.name) private readonly orderItemModel: Model<OrderItem>,
  ) {}

  async createOrder(data: Partial<Order>): Promise<Order> {
    try {
      const order = new this.orderModel(data);
      return await order.save();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Create order failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async createOrderItems(items: Partial<OrderItem>[]): Promise<OrderItem[]> {
    try {
      const created = await this.orderItemModel.create(items);
      return created as OrderItem[];
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Create order items failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findOrderById(id: string): Promise<Order | null> {
    try {
      return await this.orderModel.findById(id).exec();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Find order failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      return await this.orderModel.find({ customerId }).sort({ createdAt: -1 }).exec();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Find customer orders failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findOrderItems(orderId: string): Promise<OrderItem[]> {
    try {
      return await this.orderItemModel.find({ orderId }).exec();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Find order items failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }


  async findOrderItemById(id: string): Promise<OrderItem | null> {
    try {
      return await this.orderItemModel.findById(id).exec();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Find order item by ID failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findOrderItemsBySeller(sellerId: string): Promise<OrderItem[]> {
    try {
      return await this.orderItemModel.find({ sellerId }).exec();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Find seller order items failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async updateOrderItemStatus(id: string, status: OrderStatus): Promise<OrderItem | null> {
    try {
      return await this.orderItemModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Update order item status failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findAllOrders(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.orderModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        this.orderModel.countDocuments().exec(),
      ]);
      return { data, total };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Find all orders failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async countByStatus(status: OrderStatus): Promise<number> {
    try {
      return await this.orderModel.countDocuments({ status }).exec();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Count orders by status failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async countAllOrders(): Promise<number> {
    try {
      return await this.orderModel.countDocuments().exec();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Count all orders failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
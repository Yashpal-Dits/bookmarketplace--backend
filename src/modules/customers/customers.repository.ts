import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer } from './schemas/customer.schema';
import { CustomerStatus } from '../../common/enums/customer-status.enum';

@Injectable()
export class CustomersRepository {
  private readonly logger = new Logger(CustomersRepository.name);

  constructor(
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
  ) {}

  async findByUserId(userId: string): Promise<Customer | null> {
    try {
      return await this.customerModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to find customer by userId: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findById(id: string): Promise<Customer | null> {
    try {
      return await this.customerModel.findById(id).exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to find customer by ID: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer | null> {
    try {
      return await this.customerModel.findByIdAndUpdate(id, data, { new: true }).exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update customer: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findAll(filter: Record<string, any> = {}, page = 1, limit = 10): Promise<{ data: Customer[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.customerModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        this.customerModel.countDocuments(filter).exec(),
      ]);
      return { data, total };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch customers: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async updateStatus(id: string, status: CustomerStatus): Promise<Customer | null> {
    try {
      return await this.customerModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update customer status: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async countByStatus(status: CustomerStatus): Promise<number> {
    try {
      return await this.customerModel.countDocuments({ status }).exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to count customers by status: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async countAll(): Promise<number> {
    try {
      return await this.customerModel.countDocuments().exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to count customers: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomersRepository } from './customers.repository';
import { User } from '../users/schemas/user.schema';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import type { ICustomer, UpdateCustomerPayload } from './interfaces/customer.interface';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly customersRepository: CustomersRepository,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getProfileByUserId(userId: string) {
    try {
      const customer = await this.customersRepository.findByUserId(userId);
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);
      return { success: true, message: SUCCESS_MESSAGES.CUSTOMER_FETCHED, data: customer };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Get customer profile failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async updateProfile(userId: string, payload: UpdateCustomerPayload) {
    try {
      const customer = await this.customersRepository.findByUserId(userId);
      if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

      const updated = await this.customersRepository.update(customer._id.toString(), payload);

      await this.userModel.findByIdAndUpdate(userId, {
        firstName: payload.firstName,
        lastName: payload.lastName,
        profileImage: payload.profileImage,
      }).exec();

      this.logger.log(`Customer profile updated: ${customer.email}`, 'Customers');

      return { success: true, message: SUCCESS_MESSAGES.CUSTOMER_UPDATED, data: updated };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Update customer failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
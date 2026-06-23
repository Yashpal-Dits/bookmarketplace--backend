import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from './customers.repository';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import { LoggerService } from '../../common/logger/logger.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly logger: LoggerService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getProfileByUserId(userId: string) {
    const customer = await this.customersRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

    return { success: true, message: SUCCESS_MESSAGES.CUSTOMER_FETCHED, data: customer };
  }

  async getProfile(customerId: string) {
    const customer = await this.customersRepository.findById(customerId);
    if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

    return { success: true, message: SUCCESS_MESSAGES.CUSTOMER_FETCHED, data: customer };
  }

  async updateProfile(userId: string, data: any) {
    const customer = await this.customersRepository.findByUserId(userId);
    if (!customer) throw new NotFoundException(ERROR_MESSAGES.CUSTOMER_NOT_FOUND);

    const updatedCustomer = await this.customersRepository.update(customer._id.toString(), {
      firstName: data.firstName,
      lastName: data.lastName,
      mobileNumber: data.mobileNumber,
      addressLine: data.addressLine,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      profileImage: data.profileImage,
    });

    await this.userModel.findByIdAndUpdate(userId, {
      firstName: data.firstName,
      lastName: data.lastName,
      profileImage: data.profileImage,
    });

    this.logger.log(`Customer profile updated: ${customer.email}`, 'Customers');

    return { success: true, message: SUCCESS_MESSAGES.CUSTOMER_UPDATED, data: updatedCustomer };
  }
}
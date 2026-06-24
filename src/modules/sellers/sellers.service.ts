import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SellersRepository } from './sellers.repository';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import { LoggerService } from '../../common/logger/logger.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { SellerStatus } from '../../common/enums/seller-status.enum';

@Injectable()
export class SellersService {
  constructor(
    private readonly sellersRepository: SellersRepository,
    private readonly logger: LoggerService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) { }

  async getProfileByUserId(userId: string) {
    const seller = await this.sellersRepository.findByUserId(userId);
    if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);

    return { success: true, message: SUCCESS_MESSAGES.SELLER_FETCHED, data: seller };
  }

  async getProfile(sellerId: string) {
    const seller = await this.sellersRepository.findById(sellerId);
    if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);

    return { success: true, message: SUCCESS_MESSAGES.SELLER_FETCHED, data: seller };
  }

  async updateProfile(userId: string, data: any) {
    const seller = await this.sellersRepository.findByUserId(userId);
    if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);

    const [firstName = data.contactPerson, ...rest] = (data.contactPerson || '').split(' ');

    const updatedSeller = await this.sellersRepository.update(seller._id.toString(), {
      businessName: data.businessName,
      contactPerson: data.contactPerson,
      mobileNumber: data.mobileNumber,
      businessAddress: data.businessAddress,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      storeLogo: data.storeLogo,
    });

    await this.userModel.findByIdAndUpdate(userId, {
      firstName,
      lastName: rest.join(' '),
      profileImage: data.storeLogo,
    });

    this.logger.log(`Seller profile updated: ${seller.email}`, 'Sellers');

    return { success: true, message: SUCCESS_MESSAGES.SELLER_UPDATED, data: updatedSeller };
  }

  async assertApproved(sellerId: string): Promise<void> {
    const seller = await this.sellersRepository.findById(sellerId);
    if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);
    if (seller.status !== SellerStatus.APPROVED) {
      throw new ForbiddenException(ERROR_MESSAGES.SELLER_NOT_APPROVED);
    }
  }

  async getSellerStatus(userId: string) {
    try {
      const seller = await this.sellersRepository.findByUserId(userId);

      if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);

      const statusMessage: Record<string, string> = {
        'PENDING': 'Your seller account  is pending admin approval. You will be able to create listing one approved.',
        'APPROVED': 'Your seller account is approved. yhou can now create listing and manage your books',
        'REJECTED': 'Your seller application has been rejected. Please contact support for more information.'
      };

      return {
        success: true,
        message: statusMessage[seller.status] || 'Unknow status',
        data: {
          _id: seller._id,
          businessName: seller.businessName,
          status: seller.status,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Get seller status failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
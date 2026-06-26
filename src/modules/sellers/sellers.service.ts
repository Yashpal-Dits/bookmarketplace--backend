import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SellersRepository } from './sellers.repository';
import { User } from '../users/schemas/user.schema';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import { SellerStatus } from '../../common/enums/seller-status.enum';
import type { ISeller, UpdateSellerPayload, SellerStatusInfo } from './interfaces/seller.interface';

@Injectable()
export class SellersService {
  private readonly logger = new Logger(SellersService.name);

  constructor(
    private readonly sellersRepository: SellersRepository,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async getProfileByUserId(userId: string) {
    try {
      const seller = await this.sellersRepository.findByUserId(userId);
      if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);
      return { success: true, message: SUCCESS_MESSAGES.SELLER_FETCHED, data: seller };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Get seller profile failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async updateProfile(userId: string, payload: UpdateSellerPayload) {
    try {
      const seller = await this.sellersRepository.findByUserId(userId);
      if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);

      const [firstName = payload.contactPerson || '', ...rest] = (payload.contactPerson || '').split(' ');

      const updated = await this.sellersRepository.update(seller._id.toString(), payload);

      await this.userModel.findByIdAndUpdate(userId, {
        firstName,
        lastName: rest.join(' '),
        profileImage: payload.storeLogo,
      }).exec();

      this.logger.log(`Seller profile updated: ${seller.email}`, 'Sellers');

      return { success: true, message: SUCCESS_MESSAGES.SELLER_UPDATED, data: updated };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Update seller failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async getSellerStatus(userId: string) {
    try {
      const seller = await this.sellersRepository.findByUserId(userId);
      if (!seller) throw new NotFoundException(ERROR_MESSAGES.SELLER_NOT_FOUND);

      const statusMessages: Record<string, string> = {
        PENDING: 'Your seller account is pending admin approval.',
        APPROVED: 'Your seller account is approved. You can now create listings.',
        REJECTED: 'Your seller application has been rejected. Please contact support.',
      };

      const data: SellerStatusInfo = {
        _id: seller._id.toString(),
        businessName: seller.businessName,
        status: seller.status,
      };

      return {
        success: true,
        message: statusMessages[seller.status] || 'Unknown status',
        data,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Get seller status failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
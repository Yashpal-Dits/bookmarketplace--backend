import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seller } from './schemas/seller.schema';
import { SellerStatus } from '../../common/enums/seller-status.enum';

@Injectable()
export class SellersRepository {
  constructor(@InjectModel(Seller.name) private readonly sellerModel: Model<Seller>) {}

  async findByUserId(userId: string): Promise<Seller | null> {
    return this.sellerModel.findOne({ userId }).exec();
  }

  async findById(id: string): Promise<Seller | null> {
    return this.sellerModel.findById(id).exec();
  }

  async update(id: string, data: Partial<Seller>): Promise<Seller | null> {
    return this.sellerModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async findAll(filter: Record<string, any> = {}, page = 1, limit = 10): Promise<{ data: Seller[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.sellerModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.sellerModel.countDocuments(filter).exec(),
    ]);
    return { data, total };
  }

  async updateStatus(id: string, status: SellerStatus): Promise<Seller | null> {
    return this.sellerModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }

  async countByStatus(status: SellerStatus): Promise<number> {
    return this.sellerModel.countDocuments({ status }).exec();
  }

  async countAll(): Promise<number> {
    return this.sellerModel.countDocuments().exec();
  }
}
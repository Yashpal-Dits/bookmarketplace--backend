import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Listing } from './schemas/listing.schema';

@Injectable()
export class ListingsRepository {
  constructor(@InjectModel(Listing.name) private readonly listingModel: Model<Listing>) {}

  async create(data: Partial<Listing>): Promise<Listing> {
    const listing = new this.listingModel(data);
    return listing.save();
  }

  async findById(id: string): Promise<Listing | null> {
    return this.listingModel.findById(id).exec();
  }

  async findByBookAndSeller(bookId: string, sellerId: string): Promise<Listing | null> {
    return this.listingModel.findOne({ bookId, sellerId }).exec();
  }

  async findBySeller(sellerId: string): Promise<Listing[]> {
    return this.listingModel.find({ sellerId }).populate('bookId').exec();
  }

  async findByBookId(bookId: string, isActive = true): Promise<Listing[]> {
    return this.listingModel
      .find({ bookId, isActive })
      .populate('sellerId')
      .sort({ price: 1 })
      .exec();
  }

  async update(id: string, data: Partial<Listing>): Promise<Listing | null> {
    return this.listingModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async findAll(filter: Record<string, any> = {}) {
    return this.listingModel.find(filter).populate('bookId').exec();
  }

  async countAll(): Promise<number> {
    return this.listingModel.countDocuments().exec();
  }

  async countByFilter(filter: Record<string, any> = {}): Promise<number> {
    return this.listingModel.countDocuments(filter).exec();
  }
}
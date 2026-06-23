import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from './schemas/book.schema';
import { BookStatus } from '../../common/enums/book-status.enum';

@Injectable()
export class BooksRepository {
  constructor(@InjectModel(Book.name) private readonly bookModel: Model<Book>) {}

  async create(data: Partial<Book>): Promise<Book> {
    const book = new this.bookModel(data);
    return book.save();
  }

  async findById(id: string): Promise<Book | null> {
    return this.bookModel.findById(id).exec();
  }

  async findByIsbn(isbn: string): Promise<Book | null> {
    return this.bookModel.findOne({ isbn }).exec();
  }

  async findAll(filter: Record<string, any> = {}, page = 1, limit = 10): Promise<{ data: Book[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.bookModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.bookModel.countDocuments(filter).exec(),
    ]);
    return { data, total };
  }

  async update(id: string, data: Partial<Book>): Promise<Book | null> {
    return this.bookModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async updateStatus(id: string, status: BookStatus): Promise<Book | null> {
    return this.bookModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }

  async delete(id: string): Promise<Book | null> {
    return this.bookModel.findByIdAndDelete(id).exec();
  }

  async countByStatus(status: BookStatus): Promise<number> {
    return this.bookModel.countDocuments({ status }).exec();
  }

  async countAll(): Promise<number> {
    return this.bookModel.countDocuments().exec();
  }

  async findBestSellers(limit = 8): Promise<Book[]> {
    return this.bookModel
      .find({ status: BookStatus.APPROVED })
      .sort({ rating: -1 })
      .limit(limit)
      .exec();
  }
}
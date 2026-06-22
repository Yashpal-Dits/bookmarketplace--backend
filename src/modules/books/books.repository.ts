import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book } from './schemas/book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksRepository {
  constructor(@InjectModel(Book.name) private readonly bookModel: Model<Book>) {}

  async create(createBookDto: CreateBookDto, sellerId: string): Promise<Book> {
    const book = new this.bookModel({
      ...createBookDto,
      seller: sellerId,
    });
    return book.save();
  }

  async findAll(
    filter: any = {},
    sort: Record<string, 1 | -1> = { createdAt: -1 },
    page = 1,
    limit = 10,
  ): Promise<{ books: Book[]; total: number }> {
    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .populate('seller', 'name email')
        .exec(),
      this.bookModel.countDocuments(filter).exec(),
    ]);

    return { books, total };
  }

  async findById(id: string): Promise<Book | null> {
    return this.bookModel
      .findById(id)
      .populate('category', 'name')
      .populate('seller', 'name email')
      .exec();
  }

  async findBySeller(sellerId: string, page = 1, limit = 10): Promise<{ books: Book[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = { seller: sellerId };

    const [books, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name')
        .exec(),
      this.bookModel.countDocuments(filter).exec(),
    ]);

    return { books, total };
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book | null> {
    return this.bookModel
      .findByIdAndUpdate(id, updateBookDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Book | null> {
    return this.bookModel.findByIdAndDelete(id).exec();
  }

  async updateStock(id: string, quantity: number): Promise<Book | null> {
    return this.bookModel
      .findByIdAndUpdate(id, { $inc: { stock: quantity } }, { new: true })
      .exec();
  }
}
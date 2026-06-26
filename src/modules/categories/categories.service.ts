import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoriesRepository } from './categories.repository';
import { Book } from '../books/schemas/book.schema';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import type { CreateCategoryPayload, UpdateCategoryPayload, CategoryWithCount } from './interfaces/category.interface';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
  ) {}

  async create(payload: CreateCategoryPayload) {
    try {
      const existing = await this.categoriesRepository.findByName(payload.name);
      if (existing) throw new ConflictException(ERROR_MESSAGES.DUPLICATE_ENTRY);

      const category = await this.categoriesRepository.create(payload);
      this.logger.log(`Category created: ${category.name}`);

      return { success: true, message: SUCCESS_MESSAGES.CATEGORY_CREATED, data: category };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Create category failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findAllAdmin() {
    try {
      const categories = await this.categoriesRepository.findAll({ isActive: true });
      const total = await this.categoriesRepository.countAll();

      const data: CategoryWithCount[] = await Promise.all(
        categories.map(async (cat) => {
          const bookCount = await this.bookModel.countDocuments({ category: cat._id, status: 'APPROVED' } as any).exec();
          return { ...cat.toObject(), bookCount } as CategoryWithCount;
        }),
      );

      return { success: true, message: SUCCESS_MESSAGES.CATEGORIES_FETCHED, data, meta: { total } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Find categories failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const category = await this.categoriesRepository.findById(id);
      if (!category) throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      return { success: true, message: SUCCESS_MESSAGES.CATEGORY_FETCHED, data: category };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Find category failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async update(id: string, payload: UpdateCategoryPayload) {
    try {
      const category = await this.categoriesRepository.findById(id);
      if (!category) throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
      if (payload.name) {
        const duplicate = await this.categoriesRepository.findByName(payload.name);
        if (duplicate && duplicate._id.toString() !== id) throw new ConflictException(ERROR_MESSAGES.DUPLICATE_ENTRY);
      }

      const updated = await this.categoriesRepository.update(id, payload);
      return { success: true, message: SUCCESS_MESSAGES.CATEGORY_UPDATED, data: updated };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Update category failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const category = await this.categoriesRepository.findById(id);
      if (!category) throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);

      const bookCount = await this.bookModel.countDocuments({ category: id } as any).exec();
      if (bookCount > 0) throw new ConflictException(ERROR_MESSAGES.CATEGORY_NOT_DELETED);

      await this.categoriesRepository.delete(id);
      return { success: true, message: SUCCESS_MESSAGES.CATEGORY_DELETED };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Delete category failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
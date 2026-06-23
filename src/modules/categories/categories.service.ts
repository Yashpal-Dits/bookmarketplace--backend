import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import { Book } from '../books/schemas/book.schema';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    @InjectModel(Book.name) private readonly bookModel: Model<Book>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const existing = await this.categoriesRepository.findByName(createCategoryDto.name);
      if (existing) {
        throw new ConflictException(ERROR_MESSAGES.DUPLICATE_ENTRY);
      }

      const category = await this.categoriesRepository.create(createCategoryDto);
      this.logger.log(`Category created: ${category.name}`);

      return { success: true, message: SUCCESS_MESSAGES.CATEGORY_CREATED, data: category };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error('Failed to create category', error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findAll() {
    try {
      const categories = await this.categoriesRepository.findAll({ isActive: true });
      const total = await this.categoriesRepository.countAll();

      const categoriesWithCounts = await Promise.all(
        categories.map(async (cat) => {
          const bookCount = await this.bookModel
            .countDocuments({
              category: cat._id,
              status: 'APPROVED',
            } as any)
            .exec();
          return { ...cat.toObject(), bookCount };
        }),
      );

      return {
        success: true,
        message: SUCCESS_MESSAGES.CATEGORIES_FETCHED,
        data: categoriesWithCounts,
        meta: { total },
      };
    } catch (error) {
      this.logger.error('Failed to fetch categories', error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findAllAdmin() {
    try {
      const categories = await this.categoriesRepository.findAll();
      const total = await this.categoriesRepository.countAll();
      return { success: true, message: SUCCESS_MESSAGES.CATEGORIES_FETCHED, data: categories, meta: { total } };
    } catch (error) {
      this.logger.error('Failed to fetch all categories', error instanceof Error ? error.stack : undefined);
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
      this.logger.error(`Failed to fetch category ${id}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      const category = await this.categoriesRepository.findById(id);
      if (!category) throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);

      if (updateCategoryDto.name) {
        const duplicate = await this.categoriesRepository.findByName(updateCategoryDto.name);
        if (duplicate && duplicate._id.toString() !== id) {
          throw new ConflictException(ERROR_MESSAGES.DUPLICATE_ENTRY);
        }
      }

      const updated = await this.categoriesRepository.update(id, updateCategoryDto);
      this.logger.log(`Category updated: ${updated?.name}`);

      return { success: true, message: SUCCESS_MESSAGES.CATEGORY_UPDATED, data: updated };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Failed to update category ${id}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const category = await this.categoriesRepository.findById(id);
      if (!category) throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);

      const booksUsingCategory = await this.bookModel
        .countDocuments({ category: id } as any)
        .exec();

      if (booksUsingCategory > 0) {
        throw new ConflictException(ERROR_MESSAGES.CATEGORY_NOT_DELETED);
      }

      await this.categoriesRepository.delete(id);
      this.logger.log(`Category deleted: ${category.name}`);

      return { success: true, message: SUCCESS_MESSAGES.CATEGORY_DELETED };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      this.logger.error(`Failed to delete category ${id}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
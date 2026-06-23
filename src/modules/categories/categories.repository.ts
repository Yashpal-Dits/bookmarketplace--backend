import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesRepository {
  private readonly logger = new Logger(CategoriesRepository.name);

  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const category = new this.categoryModel(createCategoryDto);
      return await category.save();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to create category: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findAll(filter: Record<string, any> = {}): Promise<Category[]> {
    try {
      return await this.categoryModel.find(filter).sort({ name: 1 }).exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch categories: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findById(id: string): Promise<Category | null> {
    try {
      return await this.categoryModel.findById(id).exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to find category by ID: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findByName(name: string): Promise<Category | null> {
    try {
      return await this.categoryModel.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } }).exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to find category by name: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category | null> {
    try {
      return await this.categoryModel
        .findByIdAndUpdate(id, updateCategoryDto, { new: true })
        .exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update category: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async delete(id: string): Promise<Category | null> {
    try {
      return await this.categoryModel.findByIdAndDelete(id).exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete category: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async countAll(): Promise<number> {
    try {
      return await this.categoryModel.countDocuments().exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to count categories: ${message}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
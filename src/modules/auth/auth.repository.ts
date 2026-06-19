import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const user = new this.userModel(registerDto);
    return user.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async countByEmail(email: string): Promise<number> {
    return this.userModel.countDocuments({ email }).exec();
  }
}
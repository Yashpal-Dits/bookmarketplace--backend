import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
  }

  async delete(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async countByEmail(email: string): Promise<number> {
    return this.userModel.countDocuments({ email }).exec();
  }

  async updateOtp(id: string, otp: string, otpExpiresAt: Date): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { otp, otpExpiresAt }, { new: true })
      .exec();
  }

  async clearOtp(id: string): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $unset: { otp: '', otpExpiresAt: '' } }, { new: true })
      .exec();
  }

  async updateVerification(id: string, isVerified: boolean): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { isVerified }, { new: true })
      .exec();
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, { password: hashedPassword }, { new: true })
      .exec();
  }
}
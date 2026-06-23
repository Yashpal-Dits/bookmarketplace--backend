import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../modules/users/schemas/user.schema';
import { Role } from '../../common/enums/role.enum';
import { HashHelper } from '../../common/helpers/hash.helper';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class AdminSeeder {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly logger: LoggerService,
  ) {}

  async seed(): Promise<void> {
    const adminEmail = 'admin@bookmarketplace.com';

    const existingAdmin = await this.userModel.findOne({ email: adminEmail });
    if (existingAdmin) {
      this.logger.log('Admin user already exists, skipping seed', 'Seeder');
      return;
    }

    const hashedPassword = await HashHelper.hash('Admin@123');

    await this.userModel.create({
      firstName: 'Admin',
      lastName: '',
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
    });

    this.logger.log('Admin user seeded successfully', 'Seeder');
    this.logger.log('Email: admin@bookmarketplace.com', 'Seeder');
    this.logger.log('Password: Admin@123', 'Seeder');
  }
}
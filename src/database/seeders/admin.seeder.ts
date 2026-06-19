import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../modules/users/schemas/user.schema';
import { Role } from '../../common/constants/roles.constant';
import { HashHelper } from '../../common/helpers/hash.helper';

@Injectable()
export class AdminSeeder {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async seed(): Promise<void> {
    const adminEmail = 'admin@bookmarketplace.com';

    const existingAdmin = await this.userModel.findOne({ email: adminEmail });

    if (existingAdmin) {
      this.logger.log('Admin user already exists, skipping seed');
      return;
    }

    const hashedPassword = await HashHelper.hash('Admin@123');

    await this.userModel.create({
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
      isVerified: true,
    });

    this.logger.log('Admin user seeded successfully');
    this.logger.log(`Email: ${adminEmail}`);
    this.logger.log('Password: Admin@123');
  }
}
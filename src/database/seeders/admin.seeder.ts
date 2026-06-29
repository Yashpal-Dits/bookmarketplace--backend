import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User } from '../../modules/users/schemas/user.schema';
import { Role } from '../../common/enums/role.enum';
import { HashHelper } from '../../common/helpers/hash.helper';

@Injectable()
export class AdminSeeder {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}

  async seed(): Promise<void> {
    try {
      const adminEmail = this.configService.get<string>('admin.email')!;
      const adminPassword = this.configService.get<string>('admin.password')!;

      const existingAdmin = await this.userModel.findOne({ email: adminEmail }).exec();
      if (existingAdmin) {
        this.logger.log('Admin user already exists, skipping seed');
        return;
      }

      const hashedPassword = await HashHelper.hash(adminPassword);

      await this.userModel.create({
        firstName: 'Admin',
        lastName: '',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
      });

      this.logger.log('Admin user seeded successfully');
      this.logger.log(`   Email: ${adminEmail}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Admin seeding failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
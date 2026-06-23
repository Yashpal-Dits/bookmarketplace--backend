import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
import { SellersRepository } from './sellers.repository';
import { Seller, SellerSchema } from './schemas/seller.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Seller.name, schema: SellerSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SellersController],
  providers: [SellersService, SellersRepository, JwtService],
  exports: [SellersService, SellersRepository],
})
export class SellersModule {}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Seller, SellerSchema } from '../sellers/schemas/seller.schema';
import { Cart, CartSchema } from '../cart/schemas/cart.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Seller.name, schema: SellerSchema },
      { name: Cart.name, schema: CartSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        } as any,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService],
})
export class AuthModule {}
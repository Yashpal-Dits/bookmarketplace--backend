import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { Cart, CartSchema } from './schemas/cart.schema';
import { CartItem, CartItemSchema } from './schemas/cart-item.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Listing, ListingSchema } from '../listings/schemas/listing.schema';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Seller, SellerSchema } from '../sellers/schemas/seller.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: CartItem.name, schema: CartItemSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Listing.name, schema: ListingSchema },
      { name: Book.name, schema: BookSchema },
      { name: Seller.name, schema: SellerSchema },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService, CartRepository, JwtService],
  exports: [CartService, CartRepository],
})
export class CartModule {}
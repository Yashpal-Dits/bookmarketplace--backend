import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { CartRepository } from '../cart/cart.repository';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrderItem, OrderItemSchema } from './schemas/order-item.schema';
import { Cart, CartSchema } from '../cart/schemas/cart.schema';
import { CartItem, CartItemSchema } from '../cart/schemas/cart-item.schema';
import { Listing, ListingSchema } from '../listings/schemas/listing.schema';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Seller, SellerSchema } from '../sellers/schemas/seller.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: Cart.name, schema: CartSchema },
      { name: CartItem.name, schema: CartItemSchema },
      { name: Listing.name, schema: ListingSchema },
      { name: Book.name, schema: BookSchema },
      { name: Seller.name, schema: SellerSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, CartRepository, JwtService],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
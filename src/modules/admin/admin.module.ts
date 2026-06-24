import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Seller, SellerSchema } from '../sellers/schemas/seller.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Listing, ListingSchema } from '../listings/schemas/listing.schema';


@Module({
    imports : [
        MongooseModule.forFeature([
            {name: Seller.name, schema: SellerSchema},
            {name: Customer.name, schema: CustomerSchema},
            {name: Book.name, schema: BookSchema},
            {name : Listing.name, schema: ListingSchema},

        ]),
    ],
    controllers: [AdminController],
    providers: [AdminService, JwtService],
})

export class AdminModule {}
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingsRepository } from './listings.repository';
import { Listing, ListingSchema } from './schemas/listing.schema';
import { Book, BookSchema } from '../books/schemas/book.schema';
import { Seller, SellerSchema } from '../sellers/schemas/seller.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Listing.name, schema: ListingSchema },
      { name: Book.name, schema: BookSchema },
      { name: Seller.name, schema: SellerSchema },
    ]),
  ],
  controllers: [ListingsController],
  providers: [ListingsService, ListingsRepository, JwtService],
  exports: [ListingsService, ListingsRepository],
})
export class ListingsModule {}
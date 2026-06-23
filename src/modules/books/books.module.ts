import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { BooksController } from './books.controller';
import { SellerBooksController } from './seller-books.controller';
import { BooksService } from './books.service';
import { BooksRepository } from './books.repository';
import { Book, BookSchema } from './schemas/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
  ],
  controllers: [BooksController, SellerBooksController],
  providers: [BooksService, BooksRepository, JwtService],
  exports: [BooksService, BooksRepository, MongooseModule],
})
export class BooksModule {}
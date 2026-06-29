import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { BooksController } from './books.controller';
import { SellerBooksController } from './seller-books.controller';
import { BooksService } from './books.service';
import { BooksRepository } from './books.repository';
import { Book, BookSchema } from './schemas/book.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: User.name, schema: UserSchema },  
    ]),
  ],
  controllers: [BooksController, SellerBooksController],
  providers: [BooksService, BooksRepository, JwtService],
  exports: [BooksService, BooksRepository, MongooseModule],
})
export class BooksModule {}
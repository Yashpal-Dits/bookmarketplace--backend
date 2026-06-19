import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';
import { TransactionHelper } from '../common/helpers/transaction.helper';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/book-marketplace',
      }),
    }),
  ],
  providers: [DatabaseService, TransactionHelper],
  exports: [DatabaseService, TransactionHelper],
})
export class DatabaseModule {}
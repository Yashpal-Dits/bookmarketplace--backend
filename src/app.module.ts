import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './common/logger/logger.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BooksModule } from './modules/books/books.module';
import { ListingsModule } from './modules/listings/listings.module';
import { EmailModule } from './modules/email/email.module';
import { MongooseModule } from '@nestjs/mongoose';
import {User, UserSchema} from './modules/users/schemas/user.schema'
import { AdminModule } from './modules/admin/admin.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import { AdminSeeder } from './database/seeders/admin.seeder';
import { CartModule } from './modules/cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    MongooseModule.forFeature([{name: User.name, schema : UserSchema}]),
    LoggerModule,
    DatabaseModule,
    EmailModule,
    CustomersModule,
    SellersModule,
    AuthModule,
    CategoriesModule,
    BooksModule,
    ListingsModule,
    AdminModule,
    CartModule
    
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    LoggerMiddleware,
    HttpExceptionFilter,
    MongoExceptionFilter,
    AdminSeeder
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
   consumer.apply(LoggerMiddleware).forRoutes({ path: '(.*)', method: RequestMethod.ALL });
  }
}
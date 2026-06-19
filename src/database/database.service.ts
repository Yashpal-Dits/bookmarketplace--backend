import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.connection.asPromise();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Database connection failed', error);
      throw error;
    }
  }

  getConnection(): Connection {
    return this.connection;
  }

  async isConnected(): Promise<boolean> {
    return this.connection.readyState === 1;
  }

  async ping(): Promise<boolean> {
    try {
      const db = this.connection.db;
      if (!db) {
        this.logger.warn('Database not initialized yet');
        return false;
      }
      await db.admin().ping();
      return true;
    } catch (error) {
      this.logger.error('Database ping failed', error);
      return false;
    }
  }
}
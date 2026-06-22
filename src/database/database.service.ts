import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.connection.asPromise();
      this.logger.log('Database connected successfully', 'Database');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Database connection failed: ${errorMessage}`, undefined, 'Database');
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
        this.logger.warn('Database not initialized yet', 'Database');
        return false;
      }
      await db.admin().ping();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Database ping failed: ${errorMessage}`, undefined, 'Database');
      return false;
    }
  }
}
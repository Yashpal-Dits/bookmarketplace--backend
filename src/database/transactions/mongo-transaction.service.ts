import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

@Injectable()
export class MongoTransactionService {
  private readonly logger = new Logger(MongoTransactionService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async startTransaction(): Promise<ClientSession> {
    const session = await this.connection.startSession();
    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });
    return session;
  }

  async commitTransaction(session: ClientSession): Promise<void> {
    await session.commitTransaction();
    await session.endSession();
  }

  async abortTransaction(session: ClientSession): Promise<void> {
    await session.abortTransaction();
    await session.endSession();
  }

  async runInTransaction<T>(
    operation: (session: ClientSession) => Promise<T>,
  ): Promise<T> {
    const session = await this.startTransaction();
    try {
      const result = await operation(session);
      await this.commitTransaction(session);
      return result;
    } catch (error) {
      await this.abortTransaction(session);
      this.logger.error('Transaction failed, rolled back', error);
      throw error;
    }
  }
}
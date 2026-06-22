import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';
import { LoggerService } from '../../common/logger/logger.service';

@Injectable()
export class MongoTransactionService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly logger: LoggerService,
  ) {}

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Transaction failed, rolled back: ${errorMessage}`, undefined, 'Transaction');
      throw error;
    }
  }
}
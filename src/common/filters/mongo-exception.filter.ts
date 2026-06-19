import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ERROR_MESSAGES } from '../constants/messages.constant';

@Catch()
export class MongoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

    // MongoDB duplicate key error
    if (exception?.code === 11000) {
      status = HttpStatus.CONFLICT;
      const field = Object.keys(exception.keyValue || {})[0] || 'field';
      message = `Duplicate value for ${field}. ${ERROR_MESSAGES.DUPLICATE_ENTRY}`;
    }

    // MongoDB CastError (invalid ObjectId)
    if (exception?.name === 'CastError') {
      status = HttpStatus.BAD_REQUEST;
      message = ERROR_MESSAGES.INVALID_OBJECT_ID;
    }

    // MongoDB ValidationError
    if (exception?.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      const fields = Object.keys(exception.errors || {}).join(', ');
      message = `Validation failed for: ${fields}`;
    }

    const errorResponse = {
      success: false,
      message,
      error: exception?.name || 'MongoError',
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify(errorResponse)}`,
    );

    response.status(status).json(errorResponse);
  }
}
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { ERROR_MESSAGES } from '../constants/messages.constant';

@Catch()
export class MongoExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

    if (exception?.code === 11000) {
      status = HttpStatus.CONFLICT;
      const field = Object.keys(exception.keyValue || {})[0] || 'field';
      message = `Duplicate value for ${field}. ${ERROR_MESSAGES.DUPLICATE_ENTRY}`;
    }

    if (exception?.name === 'CastError') {
      status = HttpStatus.BAD_REQUEST;
      message = ERROR_MESSAGES.INVALID_OBJECT_ID;
    }

    if (exception?.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      const fields = Object.keys(exception.errors || {}).join(', ');
      message = `Validation failed for: ${fields}`;
    }

    this.logger.error(
      `MongoDB Error: ${message}`,
      exception?.stack,
      MongoExceptionFilter.name,
    );

    response.status(status).json({
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}

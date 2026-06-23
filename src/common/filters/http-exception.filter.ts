import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { ERROR_MESSAGES } from '../constants/messages.constant';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

    // Check if it's an HTTP exception
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exception.message;
      if (Array.isArray(message)) message = message[0];

      if (status >= 500) {
        this.logger.error(`${request.method} ${request.url} - ${status}`, exception.stack, 'HttpException');
      } else {
        this.logger.warn(`${request.method} ${request.url} - ${status} - ${message}`, 'HttpException');
      }
    }
    // MongoDB duplicate key error
    else if (exception?.code === 11000) {
      status = HttpStatus.CONFLICT;
      const field = Object.keys(exception.keyValue || {})[0] || 'field';
      message = `Duplicate value for ${field}`;
      this.logger.error(`${request.method} ${request.url} - MongoDB Dup: ${message}`, exception?.stack, 'MongoDB');
    }
    // MongoDB CastError (invalid ObjectId)
    else if (exception?.name === 'CastError') {
      status = HttpStatus.BAD_REQUEST;
      message = ERROR_MESSAGES.INVALID_OBJECT_ID;
      this.logger.error(`${request.method} ${request.url} - MongoDB CastError`, exception?.stack, 'MongoDB');
    }
    // MongoDB ValidationError
    else if (exception?.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      const fields = Object.keys(exception.errors || {}).join(', ');
      message = `Validation failed for: ${fields}`;
      this.logger.error(`${request.method} ${request.url} - MongoDB ValidationError`, exception?.stack, 'MongoDB');
    }
    // Unknown error
    else {
      message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
      this.logger.error(`${request.method} ${request.url} - ${exception?.message || 'Unknown error'}`, exception?.stack, 'Unknown');
    }

    response.status(status).json({
      success: false,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
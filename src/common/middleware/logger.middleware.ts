import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = request;
    const startTime = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const duration = Date.now() - startTime;

      const logData = {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
      };

      if (statusCode >= 400) {
        this.logger.warn(JSON.stringify(logData), 'HTTP');
      } else {
        this.logger.log(JSON.stringify(logData), 'HTTP');
      }
    });

    next();
  }
}
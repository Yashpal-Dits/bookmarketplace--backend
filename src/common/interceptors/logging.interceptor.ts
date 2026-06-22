import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const duration = Date.now() - now;

        if (statusCode >= 400) {
          this.logger.warn(`${method} ${url} ${statusCode} - ${duration}ms`, 'Interceptor');
        } else {
          this.logger.log(`${method} ${url} ${statusCode} - ${duration}ms`, 'Interceptor');
        }
      }),
      catchError((error) => {
        const duration = Date.now() - now;
        this.logger.error(
          `${method} ${url} - ${duration}ms`,
          error.stack,
          'Interceptor',
        );
        return throwError(() => error);
      }),
    );
  }
}
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        /**
         * Many existing services already return:
         * {
         *   success: true,
         *   message: '...',
         *   data: ...
         * }
         *
         * Do not wrap those responses again.
         */
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          ('data' in data || 'message' in data)
        ) {
          return {
            ...(data as any),
            statusCode,
          };
        }

        /**
         * For paginated responses like:
         * {
         *   data: [...],
         *   meta: {...}
         * }
         */
        if (data && typeof data === 'object' && 'meta' in data) {
          return {
            success: true,
            message: 'Success',
            ...(data as any),
            statusCode,
          };
        }

        return {
          success: true,
          message: 'Success',
          data,
          statusCode,
        };
      }),
    );
  }
}
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response.interface'

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
        // If data is already formatted (e.g. paginated), return as-is
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
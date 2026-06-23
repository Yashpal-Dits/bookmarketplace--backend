import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
} from '@nestjs/common';


@Catch()
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
  
  }
}
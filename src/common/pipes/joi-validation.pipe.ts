import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import  type { ObjectSchema } from 'joi';
import { VALIDATION_MESSAGES } from '../constants/messages.constant';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private readonly schema: ObjectSchema) {}

  transform(value: any): any {
    const { error, value: validatedValue } = this.schema.validate(value, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      throw new BadRequestException({
        success: false,
        message: VALIDATION_MESSAGES.VALIDATION_FAILED,
        errors: messages,
        statusCode: 400,
      });
    }

    return validatedValue;
  }
}
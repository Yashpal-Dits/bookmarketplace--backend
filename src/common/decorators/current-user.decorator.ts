import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | string | number => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (data) {
      const value = user?.[data];
      return value !== undefined ? value : user;
    }

    return user;
  },
);
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ERROR_MESSAGES } from '../constants/messages.constant';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_MISSING);
    }

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync<JwtPayload>(
        token,
        {
          secret:
            process.env.JWT_SECRET || 'super-secret-key-change-in-production',
        },
      );

      request['user'] = payload;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_INVALID);
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'];
    if (!authHeader) return undefined;

    const [type, token] = (authHeader as string).split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
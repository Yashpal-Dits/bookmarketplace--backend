import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

export class TokenHelper {
  static generateToken(
    jwtService: JwtService,
    payload: Omit<JwtPayload, 'iat' | 'exp'>,
  ): string {
    return jwtService.sign(payload);
  }

  static async verifyToken(
    jwtService: JwtService,
    token: string,
  ): Promise<JwtPayload> {
    return jwtService.verifyAsync<JwtPayload>(token);
  }
}
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { HashHelper } from '../../common/helpers/hash.helper';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.authRepository.countByEmail(registerDto.email);

    if (existingUser > 0) {
      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await HashHelper.hash(registerDto.password);
    const user = await this.authRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const token = this.generateToken(user);

    return {
      success: true,
      message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.authRepository.findByEmailWithPassword(loginDto.email);

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await HashHelper.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const token = this.generateToken(user);

    return {
      success: true,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    };
  }

  private generateToken(user: any): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
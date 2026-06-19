import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JoiValidationPipe } from '../../common/pipes/joi-validation.pipe';
import { registerSchema } from './validation/register.schema';
import { loginSchema } from './validation/login.schema';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new JoiValidationPipe(registerSchema))
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UsePipes(new JoiValidationPipe(loginSchema))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
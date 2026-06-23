import { Controller, Post, Body, UsePipes, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterCustomerDto, RegisterSellerDto,LoginDto,  ForgotPasswordDto, ResetPasswordDto, VerifyOtpDto,  ChangePasswordDto,  SendOtpDto} from './dto/index';
import { JoiValidationPipe } from '../../common/pipes/joi-validation.pipe';
import { registerCustomerSchema } from './validation/register-customer.schema';
import { registerSellerSchema } from './validation/register-seller.schema';
import { loginSchema } from './validation/login.schema';
import { forgotPasswordSchema } from './validation/forgot-password.schema';
import { resetPasswordSchema } from './validation/reset-password.schema';
import { verifyOtpSchema } from './validation/verify-otp.schema';
import { changePasswordSchema } from './validation/change-password.schema';
import { sendOtpSchema } from './validation/send-otp.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/customer')
  @UsePipes(new JoiValidationPipe(registerCustomerSchema))
  async registerCustomer(@Body() registerDto: RegisterCustomerDto) {
    return this.authService.registerCustomer(registerDto);
  }

  @Post('register/seller')
  @UsePipes(new JoiValidationPipe(registerSellerSchema))
  async registerSeller(@Body() registerDto: RegisterSellerDto) {
    return this.authService.registerSeller(registerDto);
  }

  @Post('login')
  @UsePipes(new JoiValidationPipe(loginSchema))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('send-otp')
  @UsePipes(new JoiValidationPipe(sendOtpSchema))
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Post('verify-otp')
  @UsePipes(new JoiValidationPipe(verifyOtpSchema))
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('forgot-password')
  @UsePipes(new JoiValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @UsePipes(new JoiValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new JoiValidationPipe(changePasswordSchema))
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }
}
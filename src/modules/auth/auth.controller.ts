import { Controller, Post, Body, UsePipes, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
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
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/customer')
  @UsePipes(new JoiValidationPipe(registerCustomerSchema))
  @ApiOperation({ summary: 'Register as a customer' })
  async registerCustomer(@Body() registerDto: RegisterCustomerDto) {
    return this.authService.registerCustomer(registerDto);
  }

  @Post('register/seller')
  @UsePipes(new JoiValidationPipe(registerSellerSchema))
  @ApiOperation({ summary: 'Register as a seller' })
  async registerSeller(@Body() registerDto: RegisterSellerDto) {
    return this.authService.registerSeller(registerDto);
  }

  @Post('login')
  @UsePipes(new JoiValidationPipe(loginSchema))
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@CurrentUser() user: JwtPayload) {
    return this.authService.logout(user.sub);
  }

  @Post('send-otp')
  @UsePipes(new JoiValidationPipe(sendOtpSchema))
  @ApiOperation({ summary: 'Send OTP for email verification' })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Post('verify-otp')
  @UsePipes(new JoiValidationPipe(verifyOtpSchema))
  @ApiOperation({ summary: 'Verify OTP' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('forgot-password')
  @UsePipes(new JoiValidationPipe(forgotPasswordSchema))
  @ApiOperation({ summary: 'Request password reset OTP' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @UsePipes(new JoiValidationPipe(resetPasswordSchema))
  @ApiOperation({ summary: 'Reset password with OTP' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
 @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new JoiValidationPipe(changePasswordSchema))
  @ApiOperation({ summary: 'Change password (requires JWT)' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.authService.changePassword(user.sub, changePasswordDto);
  }
}
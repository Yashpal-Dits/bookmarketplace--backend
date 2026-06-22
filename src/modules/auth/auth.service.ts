import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { HashHelper } from '../../common/helpers/hash.helper';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { LoggerService } from '../../common/logger/logger.service';
import { EmailService } from '../email/email.service';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.authRepository.countByEmail(registerDto.email);

    if (existingUser > 0) {
      this.logger.warn(`Registration failed - email already exists: ${registerDto.email}`, 'Auth');
      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await HashHelper.hash(registerDto.password);

    const user = await this.authRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersRepository.updateOtp(user._id.toString(), otp, otpExpiresAt);

    await this.emailService.sendOtpEmail(user.email, otp);

    const token = this.generateToken(user);

    this.logger.log(`User registered successfully (unverified): ${user.email}`, 'Auth');

    return {
      success: true,
      message: 'Registration successful. Please verify your email using the OTP sent to your email.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        token,
      },
    };
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.authRepository.findByEmailWithPassword(loginDto.email);

      if (!user) {
        this.logger.warn(`Login failed - user not found: ${loginDto.email}`, 'Auth');
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const isPasswordValid = await HashHelper.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        this.logger.warn(`Login failed - invalid password: ${loginDto.email}`, 'Auth');
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const token = this.generateToken(user);

      this.logger.log(`User logged in successfully: ${user.email}`, 'Auth');

      return {
        success: true,
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
          },
          token,
        },
      };
    } catch (error) {
      // If it's already an HttpException, re-throw it
      if (error instanceof UnauthorizedException || error instanceof NotFoundException) {
        throw error;
      }
      // Log and wrap unknown errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Login error: ${errorMessage}`, error instanceof Error ? error.stack : undefined, 'Auth');
      throw new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  async sendOtp(sendOtpDto: SendOtpDto) {
    const user = await this.authRepository.findByEmail(sendOtpDto.email);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersRepository.updateOtp(user._id.toString(), otp, otpExpiresAt);

    const sent = await this.emailService.sendOtpEmail(user.email, otp);

    if (!sent) {
      this.logger.error(`Failed to send OTP email to: ${user.email}`, undefined, 'Auth');
      throw new BadRequestException('Failed to send OTP email. Please try again later.');
    }

    this.logger.log(`OTP sent successfully to: ${user.email}`, 'Auth');

    return {
      success: true,
      message: 'OTP sent successfully to your email',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.authRepository.findByEmail(verifyOtpDto.email);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (user.isVerified) {
      return {
        success: true,
        message: 'Email is already verified',
      };
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP found. Please request a new OTP.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    if (user.otp !== verifyOtpDto.otp) {
      this.logger.warn(`Invalid OTP attempt for: ${verifyOtpDto.email}`, 'Auth');
      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    await this.usersRepository.updateVerification(user._id.toString(), true);
    await this.usersRepository.clearOtp(user._id.toString());

    this.logger.log(`Email verified successfully: ${user.email}`, 'Auth');

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.authRepository.findByEmail(forgotPasswordDto.email);

    if (!user) {
      return {
        success: true,
        message: 'If the email exists, a password reset OTP has been sent',
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersRepository.updateOtp(user._id.toString(), otp, otpExpiresAt);

    const sent = await this.emailService.sendPasswordResetEmail(user.email, otp);

    if (!sent) {
      this.logger.error(`Failed to send password reset email to: ${user.email}`, undefined, 'Auth');
      throw new BadRequestException('Failed to send reset email. Please try again later.');
    }

    this.logger.log(`Password reset OTP sent to: ${user.email}`, 'Auth');

    return {
      success: true,
      message: 'If the email exists, a password reset OTP has been sent',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.authRepository.findByEmail(resetPasswordDto.email);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP found. Please request a password reset first.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    if (user.otp !== resetPasswordDto.otp) {
      this.logger.warn(`Invalid reset OTP attempt for: ${resetPasswordDto.email}`, 'Auth');
      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    const hashedPassword = await HashHelper.hash(resetPasswordDto.newPassword);
    await this.usersRepository.updatePassword(user._id.toString(), hashedPassword);
    await this.usersRepository.clearOtp(user._id.toString());

    this.logger.log(`Password reset successful for: ${user.email}`, 'Auth');

    return {
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.authRepository.findByIdWithPassword(userId);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const isCurrentPasswordValid = await HashHelper.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      this.logger.warn(`Change password failed - invalid current password for user: ${userId}`, 'Auth');
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await HashHelper.hash(changePasswordDto.newPassword);
    await this.usersRepository.updatePassword(userId, hashedPassword);

    this.logger.log(`Password changed successfully for user: ${userId}`, 'Auth');

    return {
      success: true,
      message: 'Password changed successfully',
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
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthRepository } from './auth.repository';
import { HashHelper } from '../../common/helpers/hash.helper';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../common/constants/messages.constant';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { LoggerService } from '../../common/logger/logger.service';
import { EmailService } from '../email/email.service';
import { Role } from '../../common/enums/role.enum';
import { CustomerStatus } from '../../common/enums/customer-status.enum';
import { SellerStatus } from '../../common/enums/seller-status.enum';
import { User } from '../users/schemas/user.schema';
import { Customer } from '../customers/schemas/customer.schema';
import { Seller } from '../sellers/schemas/seller.schema';
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  RegisterCustomerDto,
  RegisterSellerDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyOtpDto,
  ChangePasswordDto,
  SendOtpDto
} from './dto/index';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly loggerService: LoggerService,
    private readonly emailService: EmailService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
  ) { }

  async registerCustomer(registerDto: RegisterCustomerDto) {
    try {
      // Check if email already exists
      const userCount = await this.authRepository.countByEmail(registerDto.email);
      if (userCount > 0) {
        throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
      }

      // Hash password
      const hashedPassword = await HashHelper.hash(registerDto.password);

      // Create user
      const user = await this.authRepository.create({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName || '',
        email: registerDto.email,
        password: hashedPassword,
        role: Role.CUSTOMER,
        mobileNumber: registerDto.mobileNumber || '',
      });

      // Create customer profile with PENDING status
      const customer = await this.customerModel.create({
        userId: user._id,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName || '',
        email: registerDto.email,
        mobileNumber: registerDto.mobileNumber || '',
        status: CustomerStatus.PENDING,
      });

      // Generate OTP and send email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await this.userModel.findByIdAndUpdate(user._id, { otp, otpExpiresAt }).exec();
      await this.emailService.sendOtpEmail(user.email, otp);

      // Generate JWT token
      const token = this.generateToken(user);

      this.logger.log(`Customer registered (pending email verification): ${user.email}`, 'Auth');

      return {
        success: true,
        message: 'Registration successful. Please check your email for the OTP to verify your account.',
        data: {
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          },
          customer: {
            _id: customer._id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            status: customer.status,
          },
          token,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Customer registration failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  async registerSeller(registerDto: RegisterSellerDto) {
    try {
      const userCount = await this.authRepository.countByEmail(registerDto.email);
      if (userCount > 0) {
        throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
      }

      const hashedPassword = await HashHelper.hash(registerDto.password);
      const [firstName = registerDto.contactPerson, ...rest] = registerDto.contactPerson.split(' ');

      const user = await this.authRepository.create({
        firstName,
        lastName: rest.join(' '),
        email: registerDto.email,
        password: hashedPassword,
        role: Role.SELLER,
        mobileNumber: registerDto.mobileNumber,
      });

      const seller = await this.sellerModel.create({
        userId: user._id,
        businessName: registerDto.businessName,
        contactPerson: registerDto.contactPerson,
        email: registerDto.email,
        mobileNumber: registerDto.mobileNumber,
        status: SellerStatus.PENDING,
      });

      const token = this.generateToken(user);

      this.logger.log(`Seller registered (pending admin approval): ${user.email}`, 'Auth');

      return {
        success: true,
        message: 'Seller registration submitted successfully. Your account is pending admin approval. You will be notified once approved.',
        data: {
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          },
          seller: {
            _id: seller._id,
            businessName: seller.businessName,
            contactPerson: seller.contactPerson,
            email: seller.email,
            status: seller.status,
          },
          token,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Seller registration failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  async login(loginDto: LoginDto) {
    try {
      // Find user with password
      const user = await this.authRepository.findByEmailWithPassword(loginDto.email);
      if (!user) {
        this.logger.warn(`Login failed - user not found: ${loginDto.email}`, 'Auth');
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Verify password
      const isPasswordValid = await HashHelper.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Login failed - invalid password: ${loginDto.email}`, 'Auth');
        throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      // Generate token regardless, but check role-specific restrictions
      const token = this.generateToken(user);
      let profile: Record<string, any> = {};

      // Check customer-specific restrictions
      if (user.role === Role.CUSTOMER) {
        const customer = await this.customerModel.findOne({ userId: user._id }).exec();

        if (!customer) {
          throw new UnauthorizedException('Customer profile not found. Please contact support.');
        }

        if (customer.status === CustomerStatus.PENDING) {
          throw new UnauthorizedException(
            'Your email is not verified yet. Please check your email for the OTP and verify your account before logging in.',
          );
        }

        if (customer.status === CustomerStatus.BLOCKED) {
          throw new UnauthorizedException(
            'Your account has been blocked. Please contact support for assistance.',
          );
        }

        profile = { customerId: customer._id, status: customer.status };
      }

      // Check seller-specific restrictions
      if (user.role === Role.SELLER) {
        const seller = await this.sellerModel.findOne({ userId: user._id }).exec();

        if (!seller) {
          throw new UnauthorizedException('Seller profile not found. Please contact support.');
        }

        if (seller.status === SellerStatus.PENDING) {
          throw new UnauthorizedException(
            'Your seller account is pending admin approval. You will be able to login once your account is approved.',
          );
        }

        if (seller.status === SellerStatus.REJECTED) {
          throw new UnauthorizedException(
            'Your seller application has been rejected. Please contact support for more information.',
          );
        }

        profile = { sellerId: seller._id, sellerStatus: seller.status };
      }

      this.logger.log(`Login successful: ${user.email} (${user.role})`, 'Auth');

      return {
        success: true,
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        data: {
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
          },
          ...profile,
          token,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Login error: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  async sendOtp(sendOtpDto: SendOtpDto) {
    try {
      const user = await this.authRepository.findByEmail(sendOtpDto.email);
      if (!user) {
        throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      // Check if customer is already ACTIVE
      if (user.role === Role.CUSTOMER) {
        const customer = await this.customerModel.findOne({ userId: user._id }).exec();
        if (customer?.status === CustomerStatus.ACTIVE) {
          throw new BadRequestException('Your email is already verified. You can login.');
        }
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await this.userModel.findByIdAndUpdate(user._id, { otp, otpExpiresAt }).exec();
      await this.emailService.sendOtpEmail(user.email, otp);

      this.logger.log(`OTP sent: ${user.email}`, 'Auth');

      return {
        success: true,
        message: 'An OTP has been sent to your email. Please check your inbox and verify.',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Send OTP failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to send OTP. Please try again later.');
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    try {
      const user = await this.authRepository.findByEmail(verifyOtpDto.email);
      if (!user) {
        throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      // Check if OTP exists
      if (!user.otp || !user.otpExpiresAt) {
        throw new BadRequestException(
          'No OTP found. Please request a new OTP by using the "Send OTP" option.',
        );
      }

      // Check if OTP expired
      if (new Date() > user.otpExpiresAt) {
        throw new BadRequestException(
          'Your OTP has expired. Please request a new OTP.',
        );
      }

      // Verify OTP
      if (user.otp !== verifyOtpDto.otp) {
        this.logger.warn(`Invalid OTP attempt for: ${verifyOtpDto.email}`, 'Auth');
        throw new BadRequestException('Invalid OTP. Please enter the correct OTP sent to your email.');
      }

      // Clear OTP fields
      await this.userModel.findByIdAndUpdate(user._id, {
        $unset: { otp: '', otpExpiresAt: '' },
      }).exec();

      // Activate customer if role is CUSTOMER
      if (user.role === Role.CUSTOMER) {
        await this.customerModel.findOneAndUpdate(
          { userId: user._id },
          { status: CustomerStatus.ACTIVE },
        ).exec();
        this.logger.log(`Customer email verified and activated: ${user.email}`, 'Auth');
      }

      return {
        success: true,
        message: 'Email verified successfully! You can now login to your account.',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Verify OTP failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to verify OTP. Please try again.');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const user = await this.authRepository.findByEmail(forgotPasswordDto.email);

      // Don't reveal if email exists (security best practice)
      if (!user) {
        return {
          success: true,
          message: 'If an account with this email exists, a password reset OTP has been sent to your email.',
        };
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await this.userModel.findByIdAndUpdate(user._id, { otp, otpExpiresAt }).exec();
      await this.emailService.sendPasswordResetEmail(user.email, otp);

      this.logger.log(`Password reset OTP sent: ${user.email}`, 'Auth');

      return {
        success: true,
        message: 'If an account with this email exists, a password reset OTP has been sent to your email.',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Forgot password error: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to process request. Please try again later.');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const user = await this.authRepository.findByEmail(resetPasswordDto.email);
      if (!user) {
        throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      // Validate OTP
      if (!user.otp || !user.otpExpiresAt) {
        throw new BadRequestException(
          'No password reset request found. Please use the "Forgot Password" option first.',
        );
      }

      if (new Date() > user.otpExpiresAt) {
        throw new BadRequestException(
          'Your OTP has expired. Please request a new password reset.',
        );
      }

      if (user.otp !== resetPasswordDto.otp) {
        this.logger.warn(`Invalid reset OTP attempt for: ${resetPasswordDto.email}`, 'Auth');
        throw new BadRequestException('Invalid OTP. Please enter the correct OTP sent to your email.');
      }

      // Hash new password and update
      const hashedPassword = await HashHelper.hash(resetPasswordDto.newPassword);
      await this.userModel.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        $unset: { otp: '', otpExpiresAt: '' },
      }).exec();

      this.logger.log(`Password reset successful: ${user.email}`, 'Auth');

      return {
        success: true,
        message: 'Your password has been reset successfully. You can now login with your new password.',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Reset password error: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to reset password. Please try again.');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    try {
      const user = await this.authRepository.findByIdWithPassword(userId);
      if (!user) {
        throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      // Verify current password
      const isValid = await HashHelper.compare(changePasswordDto.currentPassword, user.password);
      if (!isValid) {
        throw new BadRequestException('Current password is incorrect. Please try again.');
      }

      // Hash and update new password
      const hashedPassword = await HashHelper.hash(changePasswordDto.newPassword);
      await this.userModel.findByIdAndUpdate(userId, { password: hashedPassword }).exec();

      this.logger.log(`Password changed successfully for user: ${userId}`, 'Auth');

      return {
        success: true,
        message: 'Your password has been changed successfully.',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Change password error: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to change password. Please try again.');
    }
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
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthRepository } from './auth.repository';
import { HashHelper } from '../../common/helpers/hash.helper';
import { ERROR_MESSAGES } from '../../common/constants/messages.constant';
import { EmailService } from '../email/email.service';
import { Role } from '../../common/enums/role.enum';
import { CustomerStatus } from '../../common/enums/customer-status.enum';
import { SellerStatus } from '../../common/enums/seller-status.enum';
import { User } from '../users/schemas/user.schema';
import { Customer } from '../customers/schemas/customer.schema';
import { Seller } from '../sellers/schemas/seller.schema';
import { Cart } from '../cart/schemas/cart.schema';
import type {
  RegisterCustomerPayload,
  RegisterSellerPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  VerifyOtpPayload,
  ChangePasswordPayload,
  SendOtpPayload,
  RefreshTokenPayload,
} from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly ACCESS_TOKEN_EXPIRY = 900; 
  private readonly REFRESH_TOKEN_EXPIRY = 2592000; 

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
    @InjectModel(Seller.name) private readonly sellerModel: Model<Seller>,
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
  ) {}

  // --------- REGISTER CUSTOMER ------

  async registerCustomer(payload: RegisterCustomerPayload) {
    try {
      const userCount = await this.authRepository.countByEmail(payload.email);
      if (userCount > 0) {
        throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
      }

      const hashedPassword = await HashHelper.hash(payload.password);

      const user = await this.authRepository.create({
        firstName: payload.firstName,
        lastName: payload.lastName || '',
        email: payload.email,
        password: hashedPassword,
        role: Role.CUSTOMER,
        mobileNumber: payload.mobileNumber || '',
      });

      const customer = await this.customerModel.create({
        userId: user._id,
        firstName: payload.firstName,
        lastName: payload.lastName || '',
        email: payload.email,
        mobileNumber: payload.mobileNumber || '',
        status: CustomerStatus.PENDING,
      });

      await this.cartModel.create({ customerId: customer._id });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await this.userModel.findByIdAndUpdate(user._id, { otp, otpExpiresAt }).exec();
      await this.emailService.sendOtpEmail(user.email, otp);

      const accessToken = this.generateToken(user, this.ACCESS_TOKEN_EXPIRY);
      const refreshToken = this.generateToken(user, this.REFRESH_TOKEN_EXPIRY);
      await this.userModel.findByIdAndUpdate(user._id, { refreshToken }).exec();

      this.logger.log(`Customer registered (pending): ${user.email}`, 'Auth');

      return {
        success: true,
        message: 'Registration successful. Please check your email for the OTP to verify your account.',
        data: {
          user: {
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          },
          customer: {
            _id: customer._id.toString(),
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            status: customer.status,
          },
          token: accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Customer registration failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // ------- REGISTER SELLER --------

  async registerSeller(payload: RegisterSellerPayload) {
    try {
      const userCount = await this.authRepository.countByEmail(payload.email);
      if (userCount > 0) {
        throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
      }

      const hashedPassword = await HashHelper.hash(payload.password);
      const [firstName = payload.contactPerson, ...rest] = payload.contactPerson.split(' ');

      const user = await this.authRepository.create({
        firstName,
        lastName: rest.join(' '),
        email: payload.email,
        password: hashedPassword,
        role: Role.SELLER,
        mobileNumber: payload.mobileNumber,
      });

      const seller = await this.sellerModel.create({
        userId: user._id,
        businessName: payload.businessName,
        contactPerson: payload.contactPerson,
        email: payload.email,
        mobileNumber: payload.mobileNumber,
        status: SellerStatus.PENDING,
      });

      const accessToken = this.generateToken(user, this.ACCESS_TOKEN_EXPIRY);
      const refreshToken = this.generateToken(user, this.REFRESH_TOKEN_EXPIRY);
      await this.userModel.findByIdAndUpdate(user._id, { refreshToken }).exec();

      this.logger.log(`Seller registered (pending): ${user.email}`, 'Auth');

      return {
        success: true,
        message: 'Seller registration submitted successfully. Your account is pending admin approval.',
        data: {
          user: {
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          },
          seller: {
            _id: seller._id.toString(),
            businessName: seller.businessName,
            contactPerson: seller.contactPerson,
            email: seller.email,
            status: seller.status,
          },
          token: accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Seller registration failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // --------- LOGIN ---------

  async login(payload: LoginPayload) {
    try {
      const user = await this.authRepository.findByEmailWithPassword(payload.email);
      if (!user) throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);

      const isValid = await HashHelper.compare(payload.password, user.password);
      if (!isValid) throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);

      const accessToken = this.generateToken(user, this.ACCESS_TOKEN_EXPIRY);
      const refreshToken = this.generateToken(user, this.REFRESH_TOKEN_EXPIRY);
      await this.userModel.findByIdAndUpdate(user._id, { refreshToken }).exec();

      const data: Record<string, any> = {
        user: {
          _id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
        },
        token: accessToken,
        refreshToken,
      };

      if (user.role === Role.CUSTOMER) {
        const customer = await this.customerModel.findOne({ userId: user._id }).exec();
        if (!customer) throw new UnauthorizedException('Customer profile not found');
        if (customer.status === CustomerStatus.PENDING) {
          throw new UnauthorizedException('Your email is not verified yet. Please verify your email before logging in.');
        }
        if (customer.status === CustomerStatus.BLOCKED) {
          throw new UnauthorizedException('Your account has been blocked. Please contact support.');
        }
        data.customerId = customer._id.toString();
        data.status = customer.status;
      }

      if (user.role === Role.SELLER) {
        const seller = await this.sellerModel.findOne({ userId: user._id }).exec();
        if (!seller) throw new UnauthorizedException('Seller profile not found');
        if (seller.status === SellerStatus.PENDING) {
          throw new UnauthorizedException('Your seller account is pending admin approval.');
        }
        if (seller.status === SellerStatus.REJECTED) {
          throw new UnauthorizedException('Your seller application has been rejected.');
        }
        data.sellerId = seller._id.toString();
        data.sellerStatus = seller.status;
      }

      this.logger.log(`Login successful: ${user.email}`, 'Auth');

      return { success: true, message: 'Login successful', data };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Login failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
  }

  // ------ REFRESH TOKEN ------

  async refreshToken(payload: RefreshTokenPayload) {
    try {
      let decoded: any;
      try {
        decoded = this.jwtService.verify(payload.refreshToken);
      } catch {
        throw new UnauthorizedException('Invalid or expired refresh token. Please login again.');
      }

      const user = await this.userModel.findById(decoded.sub).exec();
      if (!user || user.refreshToken !== payload.refreshToken) {
        throw new UnauthorizedException('Refresh token is no longer valid. Please login again.');
      }

      const newAccessToken = this.generateToken(user, this.ACCESS_TOKEN_EXPIRY);
      const newRefreshToken = this.generateToken(user, this.REFRESH_TOKEN_EXPIRY);
      await this.userModel.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken }).exec();

      this.logger.log(`Token refreshed for: ${user.email}`, 'Auth');

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Refresh token failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to refresh token.');
    }
  }

  // ------- LOGOUT ---------

  async logout(userId: string) {
    try {
      await this.userModel.findByIdAndUpdate(userId, { $unset: { refreshToken: '' } }).exec();
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Logout failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to logout.');
    }
  }

  // -------- SEND OTP-------------

  async sendOtp(payload: SendOtpPayload) {
    try {
      const user = await this.authRepository.findByEmail(payload.email);
      if (!user) throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await this.userModel.findByIdAndUpdate(user._id, { otp, otpExpiresAt }).exec();
      await this.emailService.sendOtpEmail(user.email, otp);

      return { success: true, message: 'An OTP has been sent to your email.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Send OTP failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to send OTP.');
    }
  }

  // --------- VERIFY OTP------------

  async verifyOtp(payload: VerifyOtpPayload) {
    try {
      const user = await this.authRepository.findByEmail(payload.email);
      if (!user) throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
      if (!user.otp || !user.otpExpiresAt) {
        throw new BadRequestException('No OTP found. Please request a new OTP.');
      }
      if (new Date() > user.otpExpiresAt) {
        throw new BadRequestException('OTP has expired. Please request a new OTP.');
      }
      if (user.otp !== payload.otp) {
        throw new BadRequestException('Invalid OTP. Please try again.');
      }

      await this.userModel.findByIdAndUpdate(user._id, { $unset: { otp: '', otpExpiresAt: '' } }).exec();

      if (user.role === Role.CUSTOMER) {
        await this.customerModel.findOneAndUpdate({ userId: user._id }, { status: CustomerStatus.ACTIVE }).exec();
      }

      return { success: true, message: 'Email verified successfully! You can now login.' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Verify OTP failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to verify OTP.');
    }
  }

  // ----------- FORGOT PASSWORD ---------


  async forgotPassword(payload: ForgotPasswordPayload) {
    try {
      const user = await this.authRepository.findByEmail(payload.email);
      if (!user) {
        return { success: true, message: 'If the email exists, a password reset OTP has been sent.' };
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await this.userModel.findByIdAndUpdate(user._id, { otp, otpExpiresAt }).exec();
      await this.emailService.sendPasswordResetEmail(user.email, otp);

      return { success: true, message: 'If the email exists, a password reset OTP has been sent.' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Forgot password failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to process request.');
    }
  }

  // ------ RESET PASSWORD ---------

  async resetPassword(payload: ResetPasswordPayload) {
    try {
      const user = await this.authRepository.findByEmail(payload.email);
      if (!user) throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
      if (!user.otp || !user.otpExpiresAt) {
        throw new BadRequestException('No password reset request found.');
      }
      if (new Date() > user.otpExpiresAt) {
        throw new BadRequestException('OTP has expired.');
      }
      if (user.otp !== payload.otp) {
        throw new BadRequestException('Invalid OTP.');
      }

      const hashedPassword = await HashHelper.hash(payload.newPassword);
      await this.userModel.findByIdAndUpdate(user._id, {
        password: hashedPassword,
        $unset: { otp: '', otpExpiresAt: '' },
      }).exec();

      return { success: true, message: 'Password reset successful. You can now login.' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Reset password failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to reset password.');
    }
  }

  // ─----- CHANGE PASSWORD -----

  async changePassword(userId: string, payload: ChangePasswordPayload) {
    try {
      const user = await this.authRepository.findByIdWithPassword(userId);
      if (!user) throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);

      const isValid = await HashHelper.compare(payload.currentPassword, user.password);
      if (!isValid) throw new BadRequestException('Current password is incorrect.');

      const hashedPassword = await HashHelper.hash(payload.newPassword);
      await this.userModel.findByIdAndUpdate(userId, { password: hashedPassword }).exec();

      return { success: true, message: 'Password changed successfully.' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      const msg = error instanceof Error ? error.message : 'Unknown';
      this.logger.error(`Change password failed: ${msg}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to change password.');
    }
  }

  //----- TOKEN GENERATOR ------

  private generateToken(user: any, expiresInSeconds: number): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload, { expiresIn: expiresInSeconds });
  }
}
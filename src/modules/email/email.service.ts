import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { LoggerService } from '../../common/logger/logger.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter!: nodemailer.Transporter;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('smtp.host') || 'smtp.gmail.com',
      port: this.configService.get<number>('smtp.port') || 587,
      secure: this.configService.get<boolean>('smtp.secure') || false,
      auth: {
        user: this.configService.get<string>('smtp.user'),
        pass: this.configService.get<string>('smtp.pass'),
      },
    });

    this.logger.log('Email transporter initialized', 'Email');
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    try {
      const from = this.configService.get<string>('smtp.from') || 'noreply@bookmarketplace.com';

      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      this.logger.log(`Email sent to: ${options.to} - Subject: ${options.subject}`, 'Email');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email to ${options.to}: ${errorMessage}`, undefined, 'Email');
      return false;
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Book Marketplace</h2>
        <p style="font-size: 16px; color: #555;">Your One-Time Password (OTP) for verification is:</p>
        <div style="text-align: center; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4CAF50; background: #f9f9f9; border-radius: 5px; margin: 15px 0;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #888;">This OTP is valid for 10 minutes. Do not share this with anyone.</p>
        <p style="font-size: 14px; color: #888;">If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">Book Marketplace Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Your OTP for Email Verification',
      html,
    });
  }

  async sendPasswordResetEmail(to: string, otp: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p style="font-size: 16px; color: #555;">You requested to reset your password. Use the following OTP:</p>
        <div style="text-align: center; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #E74C3C; background: #f9f9f9; border-radius: 5px; margin: 15px 0;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #888;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #aaa; text-align: center;">Book Marketplace Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Password Reset OTP',
      html,
    });
  }
}
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  email!: string;

  @ApiProperty({ example: '123456', description: 'OTP received via email' })
  otp!: string;
}

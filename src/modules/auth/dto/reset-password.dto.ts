import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  email!: string;

  @ApiProperty({ example: '123456', description: 'OTP received via email' })
  otp!: string;

  @ApiProperty({ example: 'newPassword123', description: 'New password' })
  newPassword!: string;
}
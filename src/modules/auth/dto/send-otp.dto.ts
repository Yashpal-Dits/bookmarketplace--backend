import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  email!: string;
}
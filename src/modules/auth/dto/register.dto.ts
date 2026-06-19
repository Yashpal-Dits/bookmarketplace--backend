import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  name!: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'User password', minLength: 6 })
  password!: string;

  @ApiProperty({ example: 'user', description: 'User role', required: false, enum: ['user', 'seller', 'admin'] })
  role?: string;
}
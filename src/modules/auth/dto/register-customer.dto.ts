import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterCustomerDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  firstName!: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  lastName?: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Password', minLength: 6 })
  password!: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Mobile number' })
  mobileNumber?: string;
}
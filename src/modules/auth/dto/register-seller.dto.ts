import { ApiProperty } from '@nestjs/swagger';

export class RegisterSellerDto {
  @ApiProperty({ example: 'Bookstore Inc.', description: 'Business name' })
  businessName!: string;

  @ApiProperty({ example: 'John Doe', description: 'Contact person name' })
  contactPerson!: string;

  @ApiProperty({ example: 'john@bookstore.com', description: 'Email address' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Password', minLength: 6 })
  password!: string;

  @ApiProperty({ example: '+1234567890', description: 'Mobile number' })
  mobileNumber!: string;
}
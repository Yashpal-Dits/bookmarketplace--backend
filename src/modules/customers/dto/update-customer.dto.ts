import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'John', description: 'First name' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Mobile number' })
  mobileNumber?: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'Address line' })
  addressLine?: string;

  @ApiPropertyOptional({ example: 'New York', description: 'City' })
  city?: string;

  @ApiPropertyOptional({ example: 'NY', description: 'State' })
  state?: string;

  @ApiPropertyOptional({ example: '10001', description: 'Pincode' })
  pincode?: string;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  profileImage?: string;
}
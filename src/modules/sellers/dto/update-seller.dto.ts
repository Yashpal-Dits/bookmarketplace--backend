import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSellerDto {
  @ApiPropertyOptional({ example: 'Bookstore Inc.', description: 'Business name' })
  businessName?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Contact person name' })
  contactPerson?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Mobile number' })
  mobileNumber?: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'Business address' })
  businessAddress?: string;

  @ApiPropertyOptional({ example: 'New York', description: 'City' })
  city?: string;

  @ApiPropertyOptional({ example: 'NY', description: 'State' })
  state?: string;

  @ApiPropertyOptional({ example: '10001', description: 'Pincode' })
  pincode?: string;

  @ApiPropertyOptional({ description: 'Store logo URL' })
  storeLogo?: string;
}
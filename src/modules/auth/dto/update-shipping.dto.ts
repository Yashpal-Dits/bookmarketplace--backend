import { ApiProperty } from '@nestjs/swagger';

export class ShippingAddressDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  fullName!: string;

  @ApiProperty({ example: '+1234567890', description: 'Mobile number' })
  mobileNumber!: string;

  @ApiProperty({ example: '123 Main St', description: 'Address line' })
  addressLine!: string;

  @ApiProperty({ example: 'New York', description: 'City' })
  city!: string;

  @ApiProperty({ example: 'NY', description: 'State' })
  state!: string;

  @ApiProperty({ example: '10001', description: 'Pincode' })
  pincode!: string;
}
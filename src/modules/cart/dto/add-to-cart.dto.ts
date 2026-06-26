import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: '67a1b2c3d4e5f6a7b8c9d0e1', description: 'Listing ID' })
  listingId!: string;

  @ApiProperty({ example: 1, description: 'Quantity', minimum: 1, default: 1 })
  quantity!: number;
}
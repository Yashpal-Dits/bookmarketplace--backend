import { ApiProperty } from '@nestjs/swagger';

export class CreateListingDto {
  @ApiProperty({ example: '67a1b2c3d4e5f6a7b8c9d0e1', description: 'Book ID' })
  bookId!: string;

  @ApiProperty({ example: 499, description: 'Selling price' })
  price!: number;

  @ApiProperty({ example: 799, description: 'MRP (original price)' })
  mrp!: number;

  @ApiProperty({ example: 10, description: 'Stock quantity' })
  stock!: number;
}
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateListingDto {
  @ApiPropertyOptional({ example: 599, description: 'Selling price' })
  price?: number;

  @ApiPropertyOptional({ example: 899, description: 'MRP (original price)' })
  mrp?: number;

  @ApiPropertyOptional({ example: 15, description: 'Stock quantity' })
  stock?: number;

  @ApiPropertyOptional({ example: true, description: 'Whether listing is active' })
  isActive?: boolean;
}
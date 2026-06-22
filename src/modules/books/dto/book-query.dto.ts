import { ApiPropertyOptional } from '@nestjs/swagger';

export class BookQueryDto {
  @ApiPropertyOptional({ example: 'gatsby', description: 'Search by title, author, or description' })
  search?: string;

  @ApiPropertyOptional({ example: '67a1b2c3d4e5f6a7b8c9d0e1', description: 'Filter by category ID' })
  category?: string;

  @ApiPropertyOptional({ example: 100, description: 'Minimum price filter' })
  minPrice?: number;

  @ApiPropertyOptional({ example: 1000, description: 'Maximum price filter' })
  maxPrice?: number;

  @ApiPropertyOptional({ example: 1, description: 'Page number', default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Items per page', default: 10 })
  limit?: number;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Sort field', default: 'createdAt' })
  sort?: string;

  @ApiPropertyOptional({ example: 'desc', description: 'Sort order: asc or desc', default: 'desc' })
  order?: 'asc' | 'desc';
}
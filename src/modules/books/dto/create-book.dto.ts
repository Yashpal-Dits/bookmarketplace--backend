import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ example: 'The Great Gatsby', description: 'Book title' })
  title!: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald', description: 'Author name' })
  author!: string;

  @ApiProperty({ example: 'A story of wealth, love, and the American Dream...', description: 'Book description' })
  description!: string;

  @ApiProperty({ example: 499, description: 'Book price in INR' })
  price!: number;

  @ApiProperty({ example: '67a1b2c3d4e5f6a7b8c9d0e1', description: 'Category ID' })
  category!: string;

  @ApiProperty({ example: 10, description: 'Stock quantity' })
  stock!: number;

  @ApiPropertyOptional({ example: '978-3-16-148410-0', description: 'ISBN number' })
  isbn?: string;

  @ApiPropertyOptional({ example: 'Scribner', description: 'Publisher name' })
  publisher?: string;

  @ApiPropertyOptional({ example: 1925, description: 'Publication year' })
  publishedYear?: number;

  @ApiPropertyOptional({ example: 'English', description: 'Language' })
  language?: string;

  @ApiPropertyOptional({ example: 180, description: 'Page count' })
  pageCount?: number;
}
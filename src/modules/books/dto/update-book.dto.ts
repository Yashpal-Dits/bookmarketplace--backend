import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'The Great Gatsby', description: 'Book title' })
  title?: string;

  @ApiPropertyOptional({ example: 'F. Scott Fitzgerald', description: 'Author name' })
  author?: string;

  @ApiPropertyOptional({ example: 'An updated description...', description: 'Book description' })
  description?: string;

  @ApiPropertyOptional({ example: 599, description: 'Book price in INR' })
  price?: number;
  
  @ApiPropertyOptional({ description: 'Book images (URLs)' })
images?: string[];

  @ApiPropertyOptional({ example: '67a1b2c3d4e5f6a7b8c9d0e1', description: 'Category ID' })
  category?: string;

  @ApiPropertyOptional({ example: 15, description: 'Stock quantity' })
  stock?: number;

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

  @ApiPropertyOptional({ example: true, description: 'Whether the book is available for sale' })
  isAvailable?: boolean;
}
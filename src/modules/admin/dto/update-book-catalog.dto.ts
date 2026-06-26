import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookCatalogDto {
  @ApiPropertyOptional({ example: 'The Great Gatsby', description: 'Book title' })
  title?: string;

  @ApiPropertyOptional({ example: 'F. Scott Fitzgerald', description: 'Author name' })
  author?: string;

  @ApiPropertyOptional({ example: 'Scribner', description: 'Publisher' })
  publisher?: string;

  @ApiPropertyOptional({ example: 'An updated description...', description: 'Book description' })
  description?: string;

  @ApiPropertyOptional({ example: '978-3-16-148410-0', description: 'ISBN number' })
  isbn?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg', description: 'Cover image URL' })
  coverImage?: string;

  @ApiPropertyOptional({ example: '67a1b2c3d4e5f6a7b8c9d0e1', description: 'Category ID' })
  category?: string;
}
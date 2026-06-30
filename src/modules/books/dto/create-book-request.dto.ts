import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookRequestDto {
  @ApiProperty({ example: '9783161484100', description: 'ISBN number' })
  isbn!: string;

  @ApiProperty({ example: 'The Great Gatsby', description: 'Book title' })
  title!: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald', description: 'Author name' })
  author!: string;

  @ApiPropertyOptional({ example: 'Scribner', description: 'Publisher' })
  publisher?: string;

  @ApiProperty({
    example: 'A story of wealth, love, and the American Dream...',
    description: 'Book description',
  })
  description!: string;

  /**
   * Kept for backward compatibility.
   * New recommended flow uses uploaded coverImage file.
   */
  @ApiPropertyOptional({
    example: '/uploads/books/filename.jpg',
    description: 'Cover image path or URL',
  })
  coverImage?: string;

  @ApiPropertyOptional({
    example: '67a1b2c3d4e5f6a7b8c9d0e1',
    description: 'Category ID',
  })
  category?: string;
}
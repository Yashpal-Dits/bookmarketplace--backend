import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Fiction', description: 'Category name' })
  name!: string;

  @ApiPropertyOptional({ example: 'Fictional books and novels', description: 'Category description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Category image URL' })
  image?: string;
}
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Fiction', description: 'Category name' })
  name?: string;

  @ApiPropertyOptional({ example: 'Fictional books and novels', description: 'Category description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Category image URL' })
  image?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether category is active' })
  isActive?: boolean;
}
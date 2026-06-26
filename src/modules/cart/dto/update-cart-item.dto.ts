import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, description: 'New quantity', minimum: 1 })
  quantity!: number;
}
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'SHIPPED', description: 'New order status', enum: ['CREATED', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] })
  status!: string;
}
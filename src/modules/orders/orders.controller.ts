import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Orders')
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('customer/orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place an order from cart' })
  async placeOrder(@CurrentUser() user: JwtPayload, @Body() data: PlaceOrderDto) {
    return this.ordersService.placeOrder(user.sub, data);
  }

  @Get('customer/orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my order history' })
  async getMyOrders(@CurrentUser() user: JwtPayload) {
    return this.ordersService.getCustomerOrders(user.sub);
  }

  @Get('seller/orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my seller order items' })
  async getSellerOrders(@CurrentUser() user: JwtPayload) {
    return this.ordersService.getSellerOrderItems(user.sub);
  }

  @Patch('seller/orders/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order item status' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() data: UpdateOrderStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.ordersService.updateOrderItemStatus(id, data.status, user.sub);
  }
}
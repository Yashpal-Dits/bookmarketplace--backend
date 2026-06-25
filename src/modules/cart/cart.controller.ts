import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Cart')
@Controller('customer/cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get all items in cart' })
  async getCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.getCart(user.sub);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add item to cart' })
  async addToCart(
    @CurrentUser() user: JwtPayload,
    @Body() data: { listingId: string; quantity: number },
  ) {
    return this.cartService.addToCart(user.sub, data.listingId, data.quantity || 1);
  }

  @Patch('item/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateQuantity(
    @CurrentUser() user: JwtPayload,
    @Param('id') itemId: string,
    @Body() data: { quantity: number },
  ) {
    return this.cartService.updateQuantity(user.sub, itemId, data.quantity);
  }

  @Delete('item/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') itemId: string,
  ) {
    return this.cartService.removeItem(user.sub, itemId);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear entire cart' })
  async clearCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.clearCart(user.sub);
  }
}
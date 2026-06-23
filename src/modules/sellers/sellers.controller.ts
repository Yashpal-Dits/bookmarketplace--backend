import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SellersService } from './sellers.service';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Seller')
@Controller('seller')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get seller profile' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.sellersService.getProfileByUserId(user.sub);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update seller profile' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() data: UpdateSellerDto,
  ) {
    return this.sellersService.updateProfile(user.sub, data);
  }
}
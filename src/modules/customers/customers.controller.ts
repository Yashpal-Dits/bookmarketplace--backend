import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Customer')
@Controller('customer')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get customer profile' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.customersService.getProfileByUserId(user.sub);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update customer profile' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() data: UpdateCustomerDto,
  ) {
    return this.customersService.updateProfile(user.sub, data);
  }
}
import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Listings')
@Controller()
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get('books/:bookId/listings')
  @ApiOperation({ summary: 'Get listings for a book (public)' })
  async getListingsByBook(@Param('bookId') bookId: string) {
    return this.listingsService.getListingsByBookId(bookId);
  }

  @Post('seller/listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a listing (seller)' })
  async create(@Body() data: CreateListingDto, @CurrentUser() user: JwtPayload) {
    return this.listingsService.create(data, user.sub);
  }

  @Get('seller/listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my listings (seller)' })
  async getMyListings(@CurrentUser() user: JwtPayload) {
    return this.listingsService.getMyListings(user.sub);
  }

  @Patch('seller/listings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my listing (seller)' })
  async updateListing(
    @Param('id') id: string,
    @Body() data: UpdateListingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.listingsService.updateListing(id, data, user.sub);
  }
}
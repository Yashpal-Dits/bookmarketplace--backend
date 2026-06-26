import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateBookCatalogDto } from './dto/update-book-catalog.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary stats' })
  async getDashboard() {
    return this.adminService.getDashboardSummary();
  }

  // ─── Sellers ───────────────────────────────────────
  @Get('sellers')
  @ApiOperation({ summary: 'Get all sellers (filter by status)' })
  async getSellers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getSellers(page || 1, limit || 10, status);
  }

  @Patch('sellers/:id/approve')
  @ApiOperation({ summary: 'Approve a seller' })
  async approveSeller(@Param('id') id: string) {
    return this.adminService.updateSellerStatus(id, 'APPROVED');
  }

  @Patch('sellers/:id/reject')
  @ApiOperation({ summary: 'Reject a seller' })
  async rejectSeller(@Param('id') id: string) {
    return this.adminService.updateSellerStatus(id, 'REJECTED');
  }

  // ─── Books ─────────────────────────────────────────
  @Get('books')
  @ApiOperation({ summary: 'Get all books (filter by status)' })
  async getBooks(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getBooks(page || 1, limit || 10, status);
  }

  @Patch('books/:id/approve')
  @ApiOperation({ summary: 'Approve a book' })
  async approveBook(@Param('id') id: string) {
    return this.adminService.updateBookStatus(id, 'APPROVED');
  }

  @Patch('books/:id/reject')
  @ApiOperation({ summary: 'Reject a book' })
  async rejectBook(@Param('id') id: string) {
    return this.adminService.updateBookStatus(id, 'REJECTED');
  }

  @Patch('books/:id/catalog')
  @ApiOperation({ summary: 'Update book catalog details (title, author, etc)' })
  async updateBookCatalog(@Param('id') id: string, @Body() data: UpdateBookCatalogDto) {
    return this.adminService.updateBookCatalog(id, data);
  }

  @Delete('books/:id')
  @ApiOperation({ summary: 'Delete a book' })
  async deleteBook(@Param('id') id: string) {
    return this.adminService.deleteBook(id);
  }

  // ─── Customers ─────────────────────────────────────
  @Get('customers')
  @ApiOperation({ summary: 'Get all customers (filter by status)' })
  async getCustomers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getCustomers(page || 1, limit || 10, status);
  }

  @Patch('customers/:id/block')
  @ApiOperation({ summary: 'Block a customer' })
  async blockCustomer(@Param('id') id: string) {
    return this.adminService.updateCustomerStatus(id, 'BLOCKED');
  }

  @Patch('customers/:id/activate')
  @ApiOperation({ summary: 'Activate a customer' })
  async activateCustomer(@Param('id') id: string) {
    return this.adminService.updateCustomerStatus(id, 'ACTIVE');
  }
}
import {
  Controller, Get, Post, Body, Param, Patch, Delete, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Categories')
@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ─── Public ───────────────────────────────────────
  @Get('categories')
  @ApiOperation({ summary: 'Get all active categories (public)' })
  async findAll() {
    return this.categoriesService.findAllAdmin();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID (public)' })
  async findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  // ─── Admin ────────────────────────────────────────
  @Post('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (admin only)' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get('admin/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all categories including inactive (admin only)' })
  async findAllAdmin() {
    return this.categoriesService.findAllAdmin();
  }

  @Patch('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (admin only)' })
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete('admin/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (admin only)' })
  async delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
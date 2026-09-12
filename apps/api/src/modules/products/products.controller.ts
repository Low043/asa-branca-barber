import {
  Controller,
  Body,
  Param,
  Query,
  Get,
  Post,
  Put,
  Delete,
  Headers,
  HttpCode,
} from '@nestjs/common';
import {
  CreateProductDto,
  CreateSaleDto,
  UpdateProductDto,
} from './dtos/product.dto';
import { ProductsService } from './products.service';

@Controller('/products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  async getProducts(@Headers('x-user-phone') phone: string) {
    return await this.products.list(phone);
  }

  @Get('/sales')
  async getSales(
    @Headers('x-user-phone') phone: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = year ? Number(year) : new Date().getFullYear();
    const m = month ? Number(month) : new Date().getMonth();
    return await this.products.listSales(phone, y, m);
  }

  @Post()
  async createProduct(
    @Headers('x-user-phone') phone: string,
    @Body() dto: CreateProductDto,
  ) {
    return await this.products.create(phone, dto);
  }

  @Post(':id/sales')
  async registerSale(
    @Param('id') id: string,
    @Headers('x-user-phone') phone: string,
    @Body() dto: CreateSaleDto,
  ) {
    return await this.products.registerSale(id, phone, dto);
  }

  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Headers('x-user-phone') phone: string,
    @Body() dto: UpdateProductDto,
  ) {
    return await this.products.update(id, phone, dto);
  }

  @Delete('/sales/:id')
  @HttpCode(204)
  async cancelSale(@Param('id') id: string, @Headers('x-user-phone') phone: string) {
    await this.products.cancelSale(id, phone);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string, @Headers('x-user-phone') phone: string) {
    return await this.products.delete(id, phone);
  }
}

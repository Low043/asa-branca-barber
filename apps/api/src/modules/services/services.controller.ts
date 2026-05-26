import { Controller, Body, Param, Get, Post, Put, Delete, Headers } from '@nestjs/common';
import { CreateServiceDto, UpdateServiceDto } from './dtos/service.dto';
import { ServicesService } from './services.service';

@Controller('/services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  async getServices() {
    return await this.services.getActives();
  }

  @Post()
  async createService(
    @Headers('x-user-phone') phone: string,
    @Body() dto: CreateServiceDto,
  ) {
    return await this.services.create(phone, dto);
  }

  @Put(':id')
  async updateService(
    @Param('id') id: string,
    @Headers('x-user-phone') phone: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return await this.services.update(id, phone, dto);
  }

  @Delete(':id')
  async deleteService(@Param('id') id: string, @Headers('x-user-phone') phone: string) {
    return await this.services.delete(id, phone);
  }
}

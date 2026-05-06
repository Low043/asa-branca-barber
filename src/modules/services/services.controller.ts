import { Controller, Body, Param, Get, Post, Put, Delete } from '@nestjs/common';
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
  async createService(@Body() dto: CreateServiceDto) {
    return await this.services.create(dto);
  }

  @Put(':id')
  async updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return await this.services.update(id, dto);
  }

  @Delete(':id')
  async deleteService(@Param('id') id: string) {
    return await this.services.delete(id);
  }
}

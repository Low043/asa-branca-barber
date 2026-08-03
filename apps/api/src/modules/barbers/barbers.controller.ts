import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { BarbersService } from './barbers.service';
import { CreateBarberDto, UpdateBarberDto } from './dtos/barber.dto';

@Controller('/barbers')
export class BarbersController {
  constructor(private readonly barbers: BarbersService) {}

  @Get()
  async list(@Headers('x-user-phone') phone: string) {
    return await this.barbers.list(phone);
  }

  @Post()
  async create(@Headers('x-user-phone') phone: string, @Body() dto: CreateBarberDto) {
    return await this.barbers.create(phone, dto);
  }

  @Put(':phone')
  async update(
    @Param('phone') barberPhone: string,
    @Headers('x-user-phone') phone: string,
    @Body() dto: UpdateBarberDto,
  ) {
    return await this.barbers.update(phone, barberPhone, dto);
  }

  @Delete(':phone')
  @HttpCode(204)
  async delete(
    @Param('phone') barberPhone: string,
    @Headers('x-user-phone') phone: string,
  ) {
    await this.barbers.delete(phone, barberPhone);
  }
}

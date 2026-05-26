import {
  Controller,
  HttpException,
  Body,
  Param,
  Get,
  Post,
  Put,
  Delete,
  Headers,
  Query,
} from '@nestjs/common';
import { ScheduleExceptionsService } from './schedule-exceptions.service';
import { SchedulesService } from './schedules.service';
import { z } from 'zod';
import {
  UpdateScheduleDto,
  CreateScheduleExcptDto,
  UpdateScheduleExcptDto,
} from './dtos/schedule.dto';

@Controller('/schedules')
export class SchedulesController {
  constructor(
    private readonly scheduleExceptions: ScheduleExceptionsService,
    private readonly schedules: SchedulesService,
  ) {}

  @Get()
  async getSchedules(@Headers('x-user-phone') phone: string) {
    return await this.schedules.getAll(phone);
  }

  @Get('/exceptions')
  async getExceptions(@Headers('x-user-phone') phone: string) {
    return await this.scheduleExceptions.getAll(phone);
  }

  @Post('/exceptions')
  async createException(
    @Headers('x-user-phone') phone: string,
    @Body() dto: CreateScheduleExcptDto,
  ) {
    return await this.scheduleExceptions.create(phone, dto);
  }

  @Put('/exceptions/:id')
  async updateException(
    @Param('id') id: string,
    @Headers('x-user-phone') phone: string,
    @Body() dto: UpdateScheduleExcptDto,
  ) {
    return await this.scheduleExceptions.update(id, phone, dto);
  }

  @Delete('/exceptions/:id')
  async deleteException(@Param('id') id: string, @Headers('x-user-phone') phone: string) {
    return await this.scheduleExceptions.delete(id, phone);
  }

  @Get(':date')
  async getAvailablesByDate(
    @Param('date') date: string,
    @Query('serviceId') serviceId?: string,
  ) {
    const parsedDate = z.coerce.date().safeParse(date);
    if (!parsedDate.success) {
      throw new Error('Formato de data inválido. Use YYYY-MM-DD');
    }

    return await this.schedules.getAvailablesByDate(parsedDate.data, serviceId);
  }

  @Put(':dayOfWeek')
  async updateSchedule(
    @Param('dayOfWeek') dayOfWeek: string,
    @Headers('x-user-phone') phone: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    const parsedDayOfWeek = z.coerce.number().int().min(0).max(6).safeParse(dayOfWeek);
    if (!parsedDayOfWeek.success) {
      throw new HttpException('Id inválido. Deve ser um número inteiro entre 0 e 6', 400);
    }

    return await this.schedules.update(parsedDayOfWeek.data, phone, dto);
  }
}

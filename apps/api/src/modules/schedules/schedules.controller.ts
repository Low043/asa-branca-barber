import {
  Controller,
  HttpException,
  Body,
  Param,
  Get,
  Post,
  Put,
  Delete,
} from '@nestjs/common';
import { ScheduleExceptionsService } from './schedule-exceptions.service';
import { SchedulesService } from './schedules.service';
import { z } from 'zod';
import {
  UpdateScheduleDto,
  CreateScheduleExcptDto,
  UpdateScheduleExcptDto,
} from './dtos/schedule.dto';

// Não existem operações de criar/apagar pois as regras de horário são fixas (7 dias da semana)

@Controller('/schedules')
export class SchedulesController {
  constructor(
    private readonly schedules: SchedulesService,
    private readonly scheduleExceptions: ScheduleExceptionsService,
  ) {}

  @Get()
  async getAll() {
    return await this.schedules.getAll();
  }

  @Get('/exceptions')
  async getAllExceptions() {
    return await this.scheduleExceptions.getAll();
  }

  @Post('/exceptions')
  async createException(@Body() dto: CreateScheduleExcptDto) {
    return await this.scheduleExceptions.create(dto);
  }

  @Put('/exceptions/:id')
  async updateException(@Param('id') id: string, @Body() dto: UpdateScheduleExcptDto) {
    return await this.scheduleExceptions.update(id, dto);
  }

  @Get(':date')
  async getAvailablesByDate(@Param('date') date: string) {
    const parsedDate = z.coerce.date().safeParse(date);
    if (!parsedDate.success) {
      throw new Error('Formato de data inválido. Use YYYY-MM-DD');
    }

    return await this.schedules.getAvailablesByDate(parsedDate.data);
  }

  @Put(':id')
  async updateSchedule(@Param('id') dayOfWeek: string, @Body() dto: UpdateScheduleDto) {
    const parsedDayOfWeek = z.coerce.number().int().min(0).max(6).safeParse(dayOfWeek);
    if (!parsedDayOfWeek.success) {
      throw new HttpException('Id inválido. Deve ser um número inteiro entre 0 e 6', 400);
    }

    return await this.schedules.update(parsedDayOfWeek.data, dto);
  }

  @Delete('/exceptions/:id')
  async deleteException(@Param('id') id: string) {
    return await this.scheduleExceptions.delete(id);
  }
}

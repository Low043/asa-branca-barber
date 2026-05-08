import { Controller, HttpException, Body, Param, Get, Put } from '@nestjs/common';
import { UpdateScheduleDto } from './dtos/schedule.dto';
import { SchedulesService } from './schedules.service';
import { z } from 'zod';

// Não existem operações de criar/apagar pois as regras de horário são fixas (7 dias da semana)

@Controller('/schedules')
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get()
  async getAll() {
    return await this.schedules.getAll();
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
}

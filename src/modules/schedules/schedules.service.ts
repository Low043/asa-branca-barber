import type { Schedule, ScheduleException } from '@generated/prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { UpdateScheduleDto } from './dtos/schedule.dto';
import {
  dateWithoutTime,
  scheduleToMinutes,
  minutesToSchedule,
  dateToMinutes,
} from '../../utils/scheduleTime.util';

type ScheduleOrException = Schedule | ScheduleException | null;
const MEETING_DURATION = 30;

@Injectable()
export class SchedulesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll() {
    return await this.prismaService.schedule.findMany();
  }

  async getAvailablesByDate(date: Date): Promise<string[]> {
    date = dateWithoutTime(date);

    // Procura pelo horário regular do dia da semana
    let schedule: ScheduleOrException = await this.prismaService.schedule.findFirst({
      where: { dayOfWeek: date.getUTCDay() },
    });

    // Procura por uma exceção específica para a data (ex: feriado)
    const scheduleException = await this.prismaService.scheduleException.findFirst({
      where: { date: date },
    });

    // Se houver exceção, substitui o horário regular. Se não houver nada, barbearia está fechada
    schedule = scheduleException || schedule;
    if (!schedule) return [];

    // Busca por horários já reservados nesse dia
    const meetings = await this.prismaService.meeting.findMany({
      where: { date: { gte: date, lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) } },
    });

    const bookedTimes = meetings.map((m) => dateToMinutes(m.date));
    const openTime = scheduleToMinutes(schedule.openTime);
    const closeTime = scheduleToMinutes(schedule.closeTime);
    const lunchStart = scheduleToMinutes(schedule.lunchStart);
    const lunchEnd = scheduleToMinutes(schedule.lunchEnd);

    // Calcula todos os horários disponíveis no dia
    const availableTimes: string[] = [];
    for (let time = openTime; time < closeTime; time += MEETING_DURATION) {
      if (time >= lunchStart && time < lunchEnd) continue;
      if (bookedTimes.includes(time)) continue;

      availableTimes.push(minutesToSchedule(time));
    }

    return availableTimes;
  }

  async update(dayOfWeek: number, dto: UpdateScheduleDto) {
    return await this.prismaService.schedule.update({ where: { dayOfWeek }, data: dto });
  }
}

import { Schedule, ScheduleException, MeetingStatus } from '@generated/prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { UpdateScheduleDto } from './dtos/schedule.dto';
import {
  dateWithoutTime,
  scheduleToMinutes,
  minutesToSchedule,
  dateToMinutes,
  getLocalDateTime,
} from '../../utils/scheduleTime.util';

type ScheduleOrException = Schedule | ScheduleException | null;
const MEETING_DURATION = 30;

@Injectable()
export class SchedulesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(barberPhone: string) {
    // Garante que todos os 7 dias existam para o barbeiro
    await this.prismaService.schedule.createMany({
      data: Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        barberPhone,
        openTime: '00:00',
        closeTime: '00:00',
        lunchStart: '00:00',
        lunchEnd: '00:00',
      })),
      skipDuplicates: true,
    });

    return await this.prismaService.schedule.findMany({
      where: { barberPhone },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async getAvailablesByDate(date: Date, serviceId?: string): Promise<string[]> {
    if (!serviceId) return [];

    const service = await this.prismaService.service.findUnique({
      where: { id: serviceId },
      select: { barberPhone: true },
    });

    if (!service) throw new NotFoundException('Serviço não encontrado');

    const barberPhone = service.barberPhone;

    const localDateTime = getLocalDateTime();
    const localDate = dateWithoutTime(localDateTime);
    date = dateWithoutTime(date);

    if (date.getTime() < localDate.getTime()) return []; // Data no passado

    // Procura pelo horário regular do dia da semana
    let schedule: ScheduleOrException = await this.prismaService.schedule.findFirst({
      where: { dayOfWeek: date.getUTCDay(), barberPhone },
    });

    // Procura por uma exceção específica para a data (ex: feriado)
    const scheduleException = await this.prismaService.scheduleException.findFirst({
      where: { date: date, barberPhone },
    });

    // Se houver exceção, substitui o horário regular. Se não houver nada, barbearia está fechada
    schedule = scheduleException || schedule;
    if (!schedule) return [];

    // Busca por horários já reservados nesse dia para ESSE barbeiro
    const meetings = await this.prismaService.meeting.findMany({
      where: {
        date: { gte: date, lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) },
        status: MeetingStatus.SCHEDULED,
        service: { barberPhone },
      },
    });

    const isToday = date.getTime() === localDate.getTime();
    const timePassed = isToday ? dateToMinutes(localDateTime) : -1;
    const bookedTimes = meetings.map((m) => dateToMinutes(m.date));
    const openTime = scheduleToMinutes(schedule.openTime);
    const closeTime = scheduleToMinutes(schedule.closeTime);
    const lunchStart = scheduleToMinutes(schedule.lunchStart);
    const lunchEnd = scheduleToMinutes(schedule.lunchEnd);

    // Calcula todos os horários disponíveis no dia
    const availableTimes: string[] = [];
    for (let time = openTime; time < closeTime; time += MEETING_DURATION) {
      if (timePassed > time) continue;
      if (time >= lunchStart && time < lunchEnd) continue;
      if (bookedTimes.includes(time)) continue;

      availableTimes.push(minutesToSchedule(time));
    }

    return availableTimes;
  }

  async update(dayOfWeek: number, barberPhone: string, dto: UpdateScheduleDto) {
    return await this.prismaService.schedule.upsert({
      where: { barberPhone_dayOfWeek: { barberPhone, dayOfWeek } },
      create: {
        dayOfWeek,
        barberPhone,
        openTime: dto.openTime ?? '00:00',
        closeTime: dto.closeTime ?? '00:00',
        lunchStart: dto.lunchStart ?? '00:00',
        lunchEnd: dto.lunchEnd ?? '00:00',
      },
      update: dto,
    });
  }
}

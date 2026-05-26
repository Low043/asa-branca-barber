import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CreateScheduleExcptDto, UpdateScheduleExcptDto } from './dtos/schedule.dto';
import { dateWithoutTime, getLocalDateTime } from '../../utils/scheduleTime.util';

@Injectable()
export class ScheduleExceptionsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll(barberPhone: string) {
    const today = dateWithoutTime(getLocalDateTime());

    return await this.prismaService.scheduleException.findMany({
      where: {
        date: { gte: today },
        barberPhone,
      },
      orderBy: { date: 'asc' },
    });
  }

  async create(barberPhone: string, dto: CreateScheduleExcptDto) {
    return await this.prismaService.scheduleException.create({
      data: { ...dto, barberPhone },
    });
  }

  async update(id: string, barberPhone: string, dto: UpdateScheduleExcptDto) {
    return await this.prismaService.scheduleException.update({
      where: { id, barberPhone },
      data: dto,
    });
  }

  async delete(id: string, barberPhone: string) {
    return await this.prismaService.scheduleException.delete({
      where: { id, barberPhone },
    });
  }
}

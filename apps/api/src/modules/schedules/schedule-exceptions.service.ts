import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CreateScheduleExcptDto, UpdateScheduleExcptDto } from './dtos/schedule.dto';
import { dateWithoutTime, getLocalDateTime } from '../../utils/scheduleTime.util';

@Injectable()
export class ScheduleExceptionsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll() {
    const today = dateWithoutTime(getLocalDateTime());

    return await this.prismaService.scheduleException.findMany({
      where: {
        date: { gte: today },
      },
      orderBy: { date: 'asc' },
    });
  }

  async create(dto: CreateScheduleExcptDto) {
    return await this.prismaService.scheduleException.create({ data: dto });
  }

  async update(id: string, dto: UpdateScheduleExcptDto) {
    return await this.prismaService.scheduleException.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    return await this.prismaService.scheduleException.delete({
      where: { id },
    });
  }
}

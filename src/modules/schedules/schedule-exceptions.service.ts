import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CreateScheduleExcptDto, UpdateScheduleExcptDto } from './dtos/schedule.dto';

@Injectable()
export class ScheduleExceptionsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAll() {
    return await this.prismaService.scheduleException.findMany({
      orderBy: { date: 'desc' },
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
}

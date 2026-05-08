import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { MeetingStatus } from '@generated/prisma/enums';
import { CreateMeetingDto } from './dtos/meetings.dto';

@Injectable()
export class MeetingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getActives() {
    return await this.prismaService.meeting.findMany({
      where: { status: MeetingStatus.SCHEDULED, date: { gte: new Date() } },
    });
  }

  async create(dto: CreateMeetingDto) {
    await this.prismaService.user.createMany({
      data: [{ phone: dto.userPhone }],
      skipDuplicates: true,
    });

    return await this.prismaService.meeting.create({ data: dto });
  }

  async delete(id: string) {
    return await this.prismaService.meeting.update({
      where: { id },
      data: { status: MeetingStatus.CANCELLED },
    });
  }
}

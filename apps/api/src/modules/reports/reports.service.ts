import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { MeetingStatus } from '@generated/prisma/enums';
import { MonthlyReport } from './dtos/report.dto';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

@Injectable()
export class ReportsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMonthlyReport(
    barberPhone: string,
    year: number,
    month: number,
  ): Promise<MonthlyReport> {
    const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));

    const meetings = await this.prismaService.meeting.findMany({
      where: {
        status: MeetingStatus.COMPLETED,
        date: { gte: start, lt: end },
        service: { barberPhone },
      },
      select: { priceCents: true },
    });

    return {
      month,
      year,
      clientsAttended: meetings.length,
      balanceCents: meetings.reduce((sum, m) => sum + m.priceCents, 0),
    };
  }

  static monthName(month: number) {
    return MONTHS[month] ?? '';
  }
}

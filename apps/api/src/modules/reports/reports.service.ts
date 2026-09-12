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

    const [meetings, sales] = await Promise.all([
      this.prismaService.meeting.findMany({
        where: {
          status: MeetingStatus.COMPLETED,
          date: { gte: start, lt: end },
          service: { barberPhone },
        },
        select: { priceCents: true },
      }),
      this.prismaService.productSale.findMany({
        where: { barberPhone, date: { gte: start, lt: end } },
        select: { priceCents: true, quantity: true },
      }),
    ]);

    const servicesRevenueCents = meetings.reduce((sum, m) => sum + m.priceCents, 0);
    const productsRevenueCents = sales.reduce((sum, s) => sum + s.priceCents, 0);
    const productsSold = sales.reduce((sum, s) => sum + s.quantity, 0);

    return {
      month,
      year,
      clientsAttended: meetings.length,
      servicesRevenueCents,
      productsRevenueCents,
      productsSold,
      balanceCents: servicesRevenueCents + productsRevenueCents,
    };
  }

  static monthName(month: number) {
    return MONTHS[month] ?? '';
  }
}

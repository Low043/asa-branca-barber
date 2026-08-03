import { Controller, Get, Query, Headers } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('/reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('/monthly')
  async getMonthly(
    @Headers('x-user-phone') phone: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = year ? Number(year) : new Date().getFullYear();
    const m = month ? Number(month) : new Date().getMonth();
    return await this.reports.getMonthlyReport(phone, y, m);
  }
}

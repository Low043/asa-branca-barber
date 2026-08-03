import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@common/prisma/prisma.service';
import { MeetingStatus } from '@generated/prisma/enums';
import { getLocalDateTime } from '../../utils/scheduleTime.util';

@Injectable()
export class MeetingsScheduler {
  private readonly logger = new Logger(MeetingsScheduler.name);

  constructor(private readonly prismaService: PrismaService) {}

  @Cron('*/30 * * * *')
  async autoCompletePastMeetings() {
    const now = getLocalDateTime();

    const result = await this.prismaService.meeting.updateMany({
      where: {
        status: MeetingStatus.SCHEDULED,
        date: { lte: now },
      },
      data: { status: MeetingStatus.COMPLETED },
    });

    if (result.count > 0) {
      this.logger.log(
        `${result.count} agendamento(s) auto-concluído(s) (date <= ${now.toISOString()}).`,
      );
    }
  }
}

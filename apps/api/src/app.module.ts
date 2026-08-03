import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { ValidationModule } from './common/validation/validation.module';
import { ServicesModule } from './modules/services/services.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { MeetingsModule } from '@modules/meetings/meetings.module';
import { UsersModule } from './modules/users/users.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BarbersModule } from './modules/barbers/barbers.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    ValidationModule,
    ServicesModule,
    SchedulesModule,
    MeetingsModule,
    UsersModule,
    NotificationsModule,
    BarbersModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { ScheduleExceptionsService } from './schedule-exceptions.service';

@Module({
  imports: [],
  controllers: [SchedulesController],
  providers: [SchedulesService, ScheduleExceptionsService],
})
export class SchedulesModule {}

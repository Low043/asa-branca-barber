import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}

import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { MeetingsScheduler } from './meetings.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingsScheduler],
})
export class MeetingsModule {}

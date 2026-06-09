import { Controller, Post, Body, Headers } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SubscribeDto } from './dtos/notification.dto';

@Controller('/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('/subscribe')
  async subscribe(@Headers('x-user-phone') phone: string, @Body() dto: SubscribeDto) {
    return await this.notifications.subscribe(phone, dto);
  }
}

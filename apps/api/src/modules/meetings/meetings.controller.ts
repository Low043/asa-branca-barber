import {
  Controller,
  Body,
  Param,
  Get,
  Post,
  Delete,
  Headers,
  Query,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dtos/meetings.dto';

@Controller('/meetings')
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get()
  async getMeetings(@Headers('x-user-phone') phone: string) {
    return await this.meetings.getActives(phone);
  }

  @Get('completed')
  async getCompleted(
    @Headers('x-user-phone') phone: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = year ? Number(year) : new Date().getFullYear();
    const m = month ? Number(month) : new Date().getMonth();
    return await this.meetings.getCompletedByBarber(phone, y, m);
  }

  @Get(':phone')
  async getMeetingsByUser(@Param('phone') phone: string) {
    return await this.meetings.getByUser(phone);
  }

  @Post()
  async createMeeting(@Body() dto: CreateMeetingDto) {
    return await this.meetings.create(dto);
  }

  @Delete(':id')
  async deleteMeeting(@Param('id') id: string, @Headers('x-user-phone') phone: string) {
    return await this.meetings.delete(id, phone);
  }
}

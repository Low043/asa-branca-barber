import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { ValidationModule } from './common/validation/validation.module';
import { ServicesModule } from './modules/services/services.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { MeetingsModule } from '@modules/meetings/meetings.module';

@Module({
  imports: [
    PrismaModule,
    ValidationModule,
    ServicesModule,
    SchedulesModule,
    MeetingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

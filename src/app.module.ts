import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { ValidationModule } from './common/validation/validation.module';
import { ServicesModule } from '@modules/services/services.module';
import { HelloModule } from './modules/hello/hello.module';

@Module({
  imports: [PrismaModule, ValidationModule, HelloModule, ServicesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

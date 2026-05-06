import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { HelloModule } from './modules/hello/hello.module';

@Module({
  imports: [PrismaModule, HelloModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

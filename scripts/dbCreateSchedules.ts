import { NestFactory } from '@nestjs/core';
import { PrismaModule } from '@common/prisma/prisma.module';
import { PrismaService } from '@common/prisma/prisma.service';

const defaultTimes = {
  openTime: '09:00',
  closeTime: '18:00',
  lunchStart: '11:00',
  lunchEnd: '13:00',
};

(async () => {
  const app = await NestFactory.createApplicationContext(PrismaModule);
  const prismaService = app.get(PrismaService);

  await prismaService.schedule.createMany({
    skipDuplicates: true,
    data: [
      // { dayOfWeek: 0, ...defaultTimes }, // Domingo
      { dayOfWeek: 1, ...defaultTimes },
      { dayOfWeek: 2, ...defaultTimes },
      { dayOfWeek: 3, ...defaultTimes },
      { dayOfWeek: 4, ...defaultTimes },
      { dayOfWeek: 5, ...defaultTimes },
      // { dayOfWeek: 6, ...defaultTimes }, // Sábado
    ],
  });

  // const user = await prismaService.user.create({
  //   data: { phone: 'teste' },
  // });

  // const service = await prismaService.service.create({
  //   data: {
  //     name: 'Corte de Cabelo',
  //     priceCents: 3000,
  //     durationMinutes: 30,
  //   },
  // });

  // await prismaService.meeting.create({
  //   data: {
  //     date: new Date('2026-05-08T15:30:00Z'),
  //     clientName: 'Luís Gustavo',
  //     userPhone: user.phone,
  //     serviceId: service.id,
  //   },
  // });

  // await prismaService.scheduleException.create({
  //   data: {
  //     date: new Date('2026-05-08'),
  //     description: 'Vou trabalhar muito hoje',
  //     openTime: '00:00',
  //     closeTime: '23:00',
  //     lunchStart: '00:00',
  //     lunchEnd: '00:00',
  //   }
  // });

  app.close();
})();

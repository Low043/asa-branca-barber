import type { Schedule } from '@generated/prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const dayMessage = 'Id inválido. Deve ser um número inteiro entre 0 e 6';
const timeMessage = 'O horário deve estar no formato HH:mm';
const regexTime = /^\d{2}:\d{2}$/;

const ScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0, dayMessage).max(6, dayMessage),
  openTime: z.string().regex(regexTime, timeMessage),
  closeTime: z.string().regex(regexTime, timeMessage),
  lunchStart: z.string().regex(regexTime, timeMessage),
  lunchEnd: z.string().regex(regexTime, timeMessage),
}) satisfies z.ZodType<Schedule>;

const UpdateScheduleSchema = ScheduleSchema.omit({ dayOfWeek: true }).partial();

export class UpdateScheduleDto extends createZodDto(UpdateScheduleSchema) {}

import type { Schedule, ScheduleException } from '@generated/prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const dayMessage = 'Id inválido. Deve ser um número inteiro entre 0 e 6';
const timeMessage = 'O horário deve estar no formato HH:mm';
const regexTime = /^\d{2}:\d{2}$/;

const ScheduleSchema = z.object({
  id: z.string().uuid(),
  dayOfWeek: z.number().int().min(0, dayMessage).max(6, dayMessage),
  openTime: z.string().regex(regexTime, timeMessage),
  closeTime: z.string().regex(regexTime, timeMessage),
  lunchStart: z.string().regex(regexTime, timeMessage),
  lunchEnd: z.string().regex(regexTime, timeMessage),
  barberPhone: z.string(),
}) satisfies z.ZodType<Schedule>;

const UpdateScheduleSchema = ScheduleSchema.omit({
  id: true,
  dayOfWeek: true,
  barberPhone: true,
}).partial();

export class UpdateScheduleDto extends createZodDto(UpdateScheduleSchema) {}

const ExcptScheduleSchema = z.object({
  id: z.string().uuid(),
  date: z.coerce.date(),
  description: z.string().max(48, 'A descrição deve ter no máximo 48 caracteres'),
  openTime: z.string().regex(regexTime, timeMessage),
  closeTime: z.string().regex(regexTime, timeMessage),
  lunchStart: z.string().regex(regexTime, timeMessage),
  lunchEnd: z.string().regex(regexTime, timeMessage),
  barberPhone: z.string(),
}) satisfies z.ZodType<ScheduleException>;

const CreateExcptScheduleSchema = ExcptScheduleSchema.omit({
  id: true,
  barberPhone: true,
});
export class CreateScheduleExcptDto extends createZodDto(CreateExcptScheduleSchema) {}

const UpdateExcptScheduleSchema = ExcptScheduleSchema.omit({
  id: true,
  barberPhone: true,
}).partial();
export class UpdateScheduleExcptDto extends createZodDto(UpdateExcptScheduleSchema) {}

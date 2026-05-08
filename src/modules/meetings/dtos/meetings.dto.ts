import { Meeting, MeetingStatus, Service } from '@generated/prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const MeetingSchema = z.object({
  id: z.string(),
  date: z.coerce.date(),
  status: z.enum(MeetingStatus),
  clientName: z.string(),
  userPhone: z.string(),
  serviceId: z.string(),
}) satisfies z.ZodType<Meeting>;

export class MeetingDto extends createZodDto(MeetingSchema) {}

const CreateMeetingSchema = MeetingSchema.omit({ id: true, status: true });

export class CreateMeetingDto extends createZodDto(CreateMeetingSchema) {}

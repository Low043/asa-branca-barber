import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PushSubscriptionSchema = z.object({
  endpoint: z.url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export class SubscribeDto extends createZodDto(PushSubscriptionSchema) {}

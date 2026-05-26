import type { Service } from '@generated/prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ServiceSchema = z.object({
  id: z.string().uuid('ID do serviço inválido'),
  name: z.string().min(1, 'O nome do serviço é obrigatório'),
  priceCents: z.int().positive('O preço deve ser um número positivo'),
  durationMinutes: z.int().positive('A duração deve ser um número positivo'),
  isActive: z.boolean().default(true),
  barberPhone: z.string(),
}) satisfies z.ZodType<Service>;

const CreateServiceSchema = ServiceSchema.omit({
  id: true,
  isActive: true,
  barberPhone: true,
});

export class CreateServiceDto extends createZodDto(CreateServiceSchema) {}

const UpdateServiceSchema = CreateServiceSchema.partial();

export class UpdateServiceDto extends createZodDto(UpdateServiceSchema) {}

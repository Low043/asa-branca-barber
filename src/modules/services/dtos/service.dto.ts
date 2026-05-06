import type { Service } from '@generated/prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ServiceSchema = z.object({
  id: z.uuid('ID do serviço inválido'),
  name: z.string().min(1, 'O nome do serviço é obrigatório'),
  priceCents: z.number().positive('O preço deve ser um número positivo'),
  durationMinutes: z.number().positive('A duração deve ser um número positivo'),
  active: z.boolean().default(true),
}) satisfies z.ZodType<Service>;

const CreateServiceSchema = ServiceSchema.omit({ id: true, active: true });

export class CreateServiceDto extends createZodDto(CreateServiceSchema) {}

const UpdateServiceSchema = CreateServiceSchema.partial();

export class UpdateServiceDto extends createZodDto(UpdateServiceSchema) {}

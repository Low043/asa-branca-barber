import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateProductSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome do produto é obrigatório')
    .max(32, 'O nome deve ter no máximo 32 caracteres'),
  priceCents: z.int().positive('O preço deve ser um número positivo'),
  quantity: z.int().min(0, 'A quantidade não pode ser negativa'),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}

const UpdateProductSchema = CreateProductSchema.partial();

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}

const CreateSaleSchema = z.object({
  quantity: z.int().positive('A quantidade deve ser um número positivo'),
});

export class CreateSaleDto extends createZodDto(CreateSaleSchema) {}

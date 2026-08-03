import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const NameSchema = z
  .string()
  .min(5, 'O nome deve ter ao menos 5 caracteres')
  .regex(/^[\p{L}]+(?:\s+[\p{L}]+)*$/u, 'O nome deve conter apenas letras');

const PhoneSchema = z
  .string()
  .min(10, 'Telefone inválido')
  .max(16, 'Telefone inválido')
  .regex(/^\d+$/, 'Telefone deve conter apenas dígitos');

const CreateBarberSchema = z.object({
  name: NameSchema,
  phone: PhoneSchema,
});

export class CreateBarberDto extends createZodDto(CreateBarberSchema) {}

const UpdateBarberSchema = z.object({
  name: NameSchema,
});

export class UpdateBarberDto extends createZodDto(UpdateBarberSchema) {}

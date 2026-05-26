import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const LoginSchema = z.object({
  name: z.string().optional(),
  phone: z.string().min(10, 'Telefone inválido'),
});

export class LoginDto extends createZodDto(LoginSchema) {}

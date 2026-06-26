import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const registerUserSchema = z
  .object({
    nickname: z.string(),
  })
  .strict();

export class RegisterUserBodyDto extends createZodDto(registerUserSchema) {}

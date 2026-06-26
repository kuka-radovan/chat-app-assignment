import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const registerUserResponseSchema = z.object({
  userId: z.string(),
  nickname: z.string(),
  token: z.string(),
});

export class RegisterUserResponseBodyDto extends createZodDto(
  registerUserResponseSchema,
) {}

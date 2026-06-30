import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const listUserDtoSchema = z.object({
  userId: z.string(),
  nickname: z.string(),
});

export class ListUserDtoBody extends createZodDto(listUserDtoSchema) {}

export const registerUserResponseSchema = z.object({
  userId: z.string(),
  nickname: z.string(),
  token: z.string(),
});

export class RegisterUserResponseBodyDto extends createZodDto(
  registerUserResponseSchema,
) {}

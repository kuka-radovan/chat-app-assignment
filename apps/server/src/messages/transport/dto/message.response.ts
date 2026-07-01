import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const messageDtoSchema = z.object({
  messageId: z.string(),
  authorId: z.string(),
  nickname: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export class MessageDtoBody extends createZodDto(messageDtoSchema) {}

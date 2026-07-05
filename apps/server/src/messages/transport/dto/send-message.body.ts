import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const sendMessageSchema = z
  .object({
    content: z.string(),
  })
  .strict();

export class SendMessageBodyDto extends createZodDto(sendMessageSchema) {}

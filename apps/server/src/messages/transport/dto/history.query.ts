import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const historyQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    beforeCreatedAt: z.iso.datetime().optional(),
    beforeId: z.uuid().optional(),
    afterCreatedAt: z.iso.datetime().optional(),
    afterId: z.uuid().optional(),
  })
  .strict()
  .refine(
    (query) =>
      (!query.beforeCreatedAt && !query.beforeId) ||
      (query.beforeCreatedAt !== undefined && query.beforeId !== undefined),
    { message: 'beforeCreatedAt and beforeId must be provided together' },
  )
  .refine(
    (query) =>
      (!query.afterCreatedAt && !query.afterId) ||
      (query.afterCreatedAt !== undefined && query.afterId !== undefined),
    { message: 'afterCreatedAt and afterId must be provided together' },
  )
  .refine((query) => !(query.beforeCreatedAt && query.afterCreatedAt), {
    message: 'before and after are mutually exclusive',
  });

export class HistoryQueryDto extends createZodDto(historyQuerySchema) {}

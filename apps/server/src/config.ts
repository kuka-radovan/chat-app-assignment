import { z } from 'zod';

export const configSchema = z.object({
  SERVER_PORT: z.coerce.number().default(3000),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().default(5432),
  DATABASE_NAME: z.string(),
  DATABASE_USER: z.string(),
  DATABASE_PASSWORD: z.string(),
  CORS_ORIGIN: z.string().default('http://localhost:9000'),
});

function pickConfig<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  source: Record<string, unknown>,
): z.infer<z.ZodObject<T>> {
  const picked = Object.fromEntries(
    (Object.keys(schema.shape) as (keyof T & string)[]).map((key) => [
      key,
      source[key],
    ]),
  );
  return schema.parse(picked);
}

function buildDatabaseConnectionString(parts: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}): string {
  const { host, port, database, user, password } = parts;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

const picked = pickConfig(configSchema, process.env);

export const config = {
  ...picked,
  DATABASE_URL: buildDatabaseConnectionString({
    host: picked.DATABASE_HOST,
    port: picked.DATABASE_PORT,
    database: picked.DATABASE_NAME,
    user: picked.DATABASE_USER,
    password: picked.DATABASE_PASSWORD,
  }),
};

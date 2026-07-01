import { z } from 'zod';

export const NICKNAME_MAX_LENGTH = 32;
export const MESSAGE_MAX_LENGTH = 4000;
export const DEFAULT_HISTORY_PAGE_SIZE = 50;

const envSchema = z
  .object({
    SERVER_PORT: z.coerce.number().default(3000),
    DATABASE_HOST: z.string().default('localhost'),
    DATABASE_PORT: z.coerce.number().default(5432),
    DATABASE_NAME: z.string(),
    DATABASE_USER: z.string(),
    DATABASE_PASSWORD: z.string(),
    CORS_ORIGIN: z.string().default('http://localhost:9000'),
  })
  .transform((env) => ({
    ...env,
    NICKNAME_MAX_LENGTH,
    MESSAGE_MAX_LENGTH,
    DEFAULT_HISTORY_PAGE_SIZE,
    DATABASE_URL: buildDatabaseUrl(env),
  }));

function buildDatabaseUrl(env: {
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_NAME: string;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
}): string {
  const {
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_NAME,
    DATABASE_USER,
    DATABASE_PASSWORD,
  } = env;

  return `postgresql://${encodeURIComponent(DATABASE_USER)}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;
}

export type AppConfig = z.output<typeof envSchema>;

export const config: AppConfig = envSchema.parse(process.env);

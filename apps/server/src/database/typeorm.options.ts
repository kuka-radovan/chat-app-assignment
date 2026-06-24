import { join } from 'node:path';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import { config } from '../config';

function getSharedOptions() {
  return {
    type: 'postgres' as const,
    url: config.DATABASE_URL,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    synchronize: false,
  };
}

/** Options for the standalone CLI DataSource (migration generate/run). */
export function getTypeOrmOptions(): DataSourceOptions {
  return {
    ...getSharedOptions(),
    entities: [join(__dirname, '..', '**', '*.orm-entity.{ts,js}')],
  };
}

/** Options for NestJS entities. */
export function getNestTypeOrmOptions(): TypeOrmModuleOptions {
  return {
    ...getSharedOptions(),
    autoLoadEntities: true,
  };
}

import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from '../config';

export function getNestTypeOrmOptions(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: config.DATABASE_URL,
    synchronize: false,
    autoLoadEntities: true,
  };
}

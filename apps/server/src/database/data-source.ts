import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { MessageOrmEntity } from '../messages/infrastructure/message.orm-entity';
import { UserOrmEntity } from '../users/infrastructure/user.orm-entity';

export const dataSource = new DataSource({
  type: 'postgres',
  url: config.DATABASE_URL,
  entities: [UserOrmEntity, MessageOrmEntity],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
});

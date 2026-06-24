import { DataSource } from 'typeorm';
import { getTypeOrmOptions } from './typeorm.options';

export const dataSource = new DataSource(getTypeOrmOptions());

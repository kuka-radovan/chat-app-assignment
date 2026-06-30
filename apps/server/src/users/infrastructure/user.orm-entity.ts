import { Column, Entity, PrimaryColumn } from 'typeorm';
import { config } from '../../config';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: config.NICKNAME_MAX_LENGTH, unique: true })
  nickname!: string;

  @Column({ type: 'uuid', unique: true })
  token!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

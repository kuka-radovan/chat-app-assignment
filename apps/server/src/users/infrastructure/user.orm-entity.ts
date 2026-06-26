import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  nickname!: string;

  @Column({ type: 'uuid', unique: true })
  token!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { config } from '../../config';
import { UserOrmEntity } from '../../users/infrastructure/user.orm-entity';

@Entity('messages')
export class MessageOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @ManyToOne(() => UserOrmEntity, { nullable: false })
  @JoinColumn({ name: 'author_id' })
  author!: UserOrmEntity;

  @Column({ type: 'varchar', length: config.MESSAGE_MAX_LENGTH })
  content!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

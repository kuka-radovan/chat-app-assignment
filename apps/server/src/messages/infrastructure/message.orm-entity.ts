import { Column, Entity, PrimaryColumn } from 'typeorm';
import { config } from '../../config';

@Entity('messages')
export class MessageOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ type: 'text', length: config.MESSAGE_MAX_LENGTH })
  content!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

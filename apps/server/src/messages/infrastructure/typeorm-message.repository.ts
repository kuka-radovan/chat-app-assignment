import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Message } from '../domain/message';
import {
  type FindMessagesPageParams,
  MessageRepository,
} from '../domain/message.repository';
import { MessageMapper } from './mappers/message.mapper';
import { MessageOrmEntity } from './message.orm-entity';

@Injectable()
export class TypeOrmMessageRepository extends MessageRepository {
  constructor(
    @InjectRepository(MessageOrmEntity)
    private readonly messages: Repository<MessageOrmEntity>,
  ) {
    super();
  }

  async save(message: Message): Promise<void> {
    await this.messages.save(MessageMapper.toOrm(message));
  }

  async findPage(params: FindMessagesPageParams): Promise<Message[]> {
    const query = this.messages
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.author', 'author');

    if (params.after) {
      query
        .where(
          '(message.createdAt > :afterCreatedAt OR (message.createdAt = :afterCreatedAt AND message.id > :afterId))',
          {
            afterCreatedAt: params.after.createdAt,
            afterId: params.after.id,
          },
        )
        .orderBy('message.createdAt', 'ASC')
        .addOrderBy('message.id', 'ASC');
    } else if (params.before) {
      query
        .where(
          '(message.createdAt < :beforeCreatedAt OR (message.createdAt = :beforeCreatedAt AND message.id < :beforeId))',
          {
            beforeCreatedAt: params.before.createdAt,
            beforeId: params.before.id,
          },
        )
        .orderBy('message.createdAt', 'DESC')
        .addOrderBy('message.id', 'DESC');
    } else {
      query
        .orderBy('message.createdAt', 'DESC')
        .addOrderBy('message.id', 'DESC');
    }

    const entities = await query.take(params.limit).getMany();

    return entities.map((entity) => MessageMapper.toDomain(entity));
  }
}

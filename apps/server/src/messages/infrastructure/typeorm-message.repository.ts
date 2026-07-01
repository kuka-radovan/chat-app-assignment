import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Message } from '../domain/message';
import { MessageRepository } from '../domain/message.repository';
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

  async findAll(): Promise<Message[]> {
    const entities = await this.messages.find({
      relations: { author: true },
      order: { createdAt: 'ASC', id: 'ASC' },
    });

    return entities.map((entity) => MessageMapper.toDomain(entity));
  }
}

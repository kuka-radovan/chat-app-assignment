import { Message } from '../../domain/message';
import { MessageContent } from '../../domain/value-objects/message-content';
import { MessageId } from '../../domain/value-objects/message-id';
import { UserId } from '../../../users/domain/value-objects/user-id';
import { MessageOrmEntity } from '../message.orm-entity';

export class MessageMapper {
  static toOrm(message: Message): MessageOrmEntity {
    const entity = new MessageOrmEntity();

    entity.id = message.id.value;
    entity.authorId = message.authorId.value;
    entity.content = message.content.value;
    entity.createdAt = message.createdAt;

    return entity;
  }

  static toDomain(entity: MessageOrmEntity): Message {
    return Message.reconstitute({
      id: MessageId.from(entity.id),
      authorId: UserId.from(entity.authorId),
      content: MessageContent.from(entity.content),
      createdAt: entity.createdAt,
    });
  }
}

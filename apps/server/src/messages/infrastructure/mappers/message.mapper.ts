import { Message } from '../../domain/message';
import { UserOrmEntity } from '../../../users/infrastructure/user.orm-entity';
import { Nickname } from '../../../users/domain/value-objects/nickname';
import { UserId } from '../../../users/domain/value-objects/user-id';
import { MessageAuthor } from '../../domain/value-objects/message-author';
import { MessageContent } from '../../domain/value-objects/message-content';
import { MessageId } from '../../domain/value-objects/message-id';
import { MessageOrmEntity } from '../message.orm-entity';

export class MessageMapper {
  static toOrm(message: Message): MessageOrmEntity {
    const entity = new MessageOrmEntity();

    entity.id = message.id.value;
    entity.author = { id: message.author.id.value } as UserOrmEntity;
    entity.content = message.content.value;
    entity.createdAt = message.createdAt;

    return entity;
  }

  static toDomain(entity: MessageOrmEntity): Message {
    return Message.reconstitute({
      id: MessageId.from(entity.id),
      author: MessageAuthor.create(
        UserId.from(entity.author.id),
        Nickname.from(entity.author.nickname),
      ),
      content: MessageContent.from(entity.content),
      createdAt: entity.createdAt,
    });
  }
}

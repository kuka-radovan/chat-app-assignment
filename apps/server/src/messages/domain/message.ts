import type { Clock } from '../../common/clock/clock.port';
import type { IdGenerator } from '../../common/id/id-generator.port';
import type { UserId } from '../../users/domain/value-objects/user-id';
import { MessageAuthor } from './value-objects/message-author';
import type { MessageContent } from './value-objects/message-content';
import { MessageId } from './value-objects/message-id';

export class Message {
  private constructor(
    readonly id: MessageId,
    readonly author: MessageAuthor,
    readonly content: MessageContent,
    readonly createdAt: Date,
  ) {}

  static create(
    authorId: UserId,
    content: MessageContent,
    clock: Clock,
    idGenerator: IdGenerator,
  ): Message {
    return new Message(
      MessageId.generate(idGenerator),
      MessageAuthor.fromId(authorId),
      content,
      clock.now(),
    );
  }

  static reconstitute(params: {
    id: MessageId;
    author: MessageAuthor;
    content: MessageContent;
    createdAt: Date;
  }): Message {
    return new Message(
      params.id,
      params.author,
      params.content,
      params.createdAt,
    );
  }
}

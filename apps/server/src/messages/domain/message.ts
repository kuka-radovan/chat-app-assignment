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

  static create(authorId: UserId, content: MessageContent): Message {
    return new Message(
      MessageId.generate(),
      MessageAuthor.fromId(authorId),
      content,
      new Date(),
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

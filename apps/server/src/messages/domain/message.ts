import type { UserId } from '../../users/domain/value-objects/user-id';
import type { MessageContent } from './value-objects/message-content';
import { MessageId } from './value-objects/message-id';

export class Message {
  private constructor(
    readonly id: MessageId,
    readonly authorId: UserId,
    readonly content: MessageContent,
    readonly createdAt: Date,
  ) {}

  static create(authorId: UserId, content: MessageContent): Message {
    return new Message(MessageId.generate(), authorId, content, new Date());
  }

  static reconstitute(params: {
    id: MessageId;
    authorId: UserId;
    content: MessageContent;
    createdAt: Date;
  }): Message {
    return new Message(
      params.id,
      params.authorId,
      params.content,
      params.createdAt,
    );
  }
}

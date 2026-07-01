import type { Nickname } from '../../../users/domain/value-objects/nickname';
import type { UserId } from '../../../users/domain/value-objects/user-id';

export class MessageAuthor {
  private constructor(
    readonly id: UserId,
    readonly nickname: Nickname | null,
  ) {}

  static fromId(id: UserId): MessageAuthor {
    return new MessageAuthor(id, null);
  }

  static create(id: UserId, nickname: Nickname): MessageAuthor {
    return new MessageAuthor(id, nickname);
  }
}

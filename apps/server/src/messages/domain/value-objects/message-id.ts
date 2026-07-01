import { randomUUID } from 'crypto';
import { isUuid } from '../../../common/uuid';

export class MessageId {
  private constructor(readonly value: string) {}

  static generate(): MessageId {
    return new MessageId(randomUUID());
  }

  static from(value: string): MessageId {
    if (!isUuid(value)) {
      throw new Error(`Invalid message id: ${value}`);
    }

    return new MessageId(value);
  }
}

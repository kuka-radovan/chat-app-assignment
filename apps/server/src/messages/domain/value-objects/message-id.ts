import { IdGenerator } from '../../../common/id/id-generator.port';
import { isUuid } from '../../../common/uuid';

export class MessageId {
  private constructor(readonly value: string) {}

  static generate(idGenerator: IdGenerator): MessageId {
    return new MessageId(idGenerator.generate());
  }

  static from(value: string): MessageId {
    if (!isUuid(value)) {
      throw new Error(`Invalid message id: ${value}`);
    }

    return new MessageId(value);
  }
}

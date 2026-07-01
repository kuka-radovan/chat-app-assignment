import { randomUUID } from 'crypto';
import { isUuid } from '../../../common/uuid';

export class UserId {
  private constructor(readonly value: string) {}

  static generate(): UserId {
    return new UserId(randomUUID());
  }

  static from(value: string): UserId {
    if (!isUuid(value)) {
      throw new Error(`Invalid user id: ${value}`);
    }

    return new UserId(value);
  }
}

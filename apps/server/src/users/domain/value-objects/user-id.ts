import { IdGenerator } from '../../../common/id/id-generator.port';
import { isUuid } from '../../../common/uuid';

export class UserId {
  private constructor(readonly value: string) {}

  static generate(idGenerator: IdGenerator): UserId {
    return new UserId(idGenerator.generate());
  }

  static from(value: string): UserId {
    if (!isUuid(value)) {
      throw new Error(`Invalid user id: ${value}`);
    }

    return new UserId(value);
  }
}

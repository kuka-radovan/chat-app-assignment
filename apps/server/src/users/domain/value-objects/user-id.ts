import { randomUUID } from 'crypto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class UserId {
  private constructor(readonly value: string) {}

  static generate(): UserId {
    return new UserId(randomUUID());
  }

  static from(value: string): UserId {
    if (!UUID_PATTERN.test(value)) {
      throw new Error(`Invalid user id: ${value}`);
    }

    return new UserId(value);
  }
}

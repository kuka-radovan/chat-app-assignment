import { randomUUID } from 'crypto';
import { isUuid } from '../../../common/uuid';

export class AuthToken {
  private constructor(readonly value: string) {}

  static generate(): AuthToken {
    return new AuthToken(randomUUID());
  }

  static from(value: string): AuthToken {
    if (!isUuid(value)) {
      throw new InvalidAuthTokenError();
    }

    return new AuthToken(value);
  }
}

export class InvalidAuthTokenError extends Error {
  constructor() {
    super('Invalid auth token');
    this.name = 'InvalidAuthTokenError';
  }
}

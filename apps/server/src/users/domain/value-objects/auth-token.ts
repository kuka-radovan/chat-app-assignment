import { randomUUID } from 'crypto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AuthToken {
  private constructor(readonly value: string) {}

  static generate(): AuthToken {
    return new AuthToken(randomUUID());
  }

  static from(value: string): AuthToken {
    if (!UUID_PATTERN.test(value)) {
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

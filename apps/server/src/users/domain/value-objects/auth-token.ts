import { IdGenerator } from '../../../common/id/id-generator.port';
import { isUuid } from '../../../common/uuid';

export class AuthToken {
  private constructor(readonly value: string) {}

  static generate(idGenerator: IdGenerator): AuthToken {
    return new AuthToken(idGenerator.generate());
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

import { AuthToken } from './value-objects/auth-token';
import { Nickname } from './value-objects/nickname';
import { UserId } from './value-objects/user-id';

export class User {
  private constructor(
    readonly id: UserId,
    readonly nickname: Nickname,
    readonly token: AuthToken,
    readonly createdAt: Date,
  ) {}

  static create(nickname: Nickname): User {
    return new User(
      UserId.generate(),
      nickname,
      AuthToken.generate(),
      new Date(),
    );
  }

  static reconstitute(params: {
    id: UserId;
    nickname: Nickname;
    token: AuthToken;
    createdAt: Date;
  }): User {
    return new User(params.id, params.nickname, params.token, params.createdAt);
  }
}

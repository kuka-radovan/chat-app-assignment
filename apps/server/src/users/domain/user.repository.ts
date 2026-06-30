import type { AuthToken } from './value-objects/auth-token';
import type { Nickname } from './value-objects/nickname';
import type { User } from './user';

export abstract class UserRepository {
  abstract save(user: User): Promise<void>;
  abstract findByNickname(nickname: Nickname): Promise<User | null>;
  abstract findByToken(token: AuthToken): Promise<User | null>;
  abstract findAll(): Promise<User[]>;
}

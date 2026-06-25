import type { Nickname } from './value-objects/nickname';
import type { User } from './user';

export abstract class UserRepository {
  abstract save(user: User): Promise<void>;
  abstract findByNickname(nickname: Nickname): Promise<User | null>;
}

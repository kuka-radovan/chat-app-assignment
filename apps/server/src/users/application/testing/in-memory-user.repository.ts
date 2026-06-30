import { NicknameAlreadyTakenError } from '../../domain/errors';
import type { AuthToken } from '../../domain/value-objects/auth-token';
import type { Nickname } from '../../domain/value-objects/nickname';
import type { User } from '../../domain/user';
import { UserRepository } from '../../domain/user.repository';

export class InMemoryUserRepository extends UserRepository {
  private readonly byNickname = new Map<string, User>();

  save(user: User): Promise<void> {
    if (this.byNickname.has(user.nickname.value)) {
      return Promise.reject(new NicknameAlreadyTakenError(user.nickname));
    }

    this.byNickname.set(user.nickname.value, user);
    return Promise.resolve();
  }

  findByNickname(nickname: Nickname): Promise<User | null> {
    return Promise.resolve(this.byNickname.get(nickname.value) ?? null);
  }

  findByToken(token: AuthToken): Promise<User | null> {
    for (const user of this.byNickname.values()) {
      if (user.token.value === token.value) {
        return Promise.resolve(user);
      }
    }

    return Promise.resolve(null);
  }

  findAll(): Promise<User[]> {
    const users = [...this.byNickname.values()].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    return Promise.resolve(users);
  }
}

import type { User } from '../domain/user';
import type { UserRepository } from '../domain/user.repository';
import { AuthToken } from '../domain/value-objects/auth-token';

export class ResolveUserByTokenUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(rawToken: string): Promise<User | null> {
    const token = AuthToken.from(rawToken);
    return this.userRepository.findByToken(token);
  }
}

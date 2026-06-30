import type { User } from '../domain/user';
import type { UserRepository } from '../domain/user.repository';

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}

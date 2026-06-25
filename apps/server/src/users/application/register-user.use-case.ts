import { Nickname } from '../domain/value-objects/nickname';
import { NicknameAlreadyTakenError } from '../domain/value-objects/nickname';
import { User } from '../domain/user';
import type { UserRepository } from '../domain/user.repository';

export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(rawNickname: string): Promise<User> {
    const nickname = Nickname.from(rawNickname);

    const existing = await this.userRepository.findByNickname(nickname);
    if (existing) {
      throw new NicknameAlreadyTakenError(nickname);
    }

    const user = User.create(nickname);
    await this.userRepository.save(user);
    return user;
  }
}

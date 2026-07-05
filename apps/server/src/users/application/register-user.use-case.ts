import type { Clock } from '../../common/clock/clock.port';
import type { IdGenerator } from '../../common/id/id-generator.port';
import { Nickname } from '../domain/value-objects/nickname';
import { NicknameAlreadyTakenError } from '../domain/errors';
import { User } from '../domain/user';
import type { UserRepository } from '../domain/user.repository';

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(rawNickname: string): Promise<User> {
    const nickname = Nickname.from(rawNickname);

    const existing = await this.userRepository.findByNickname(nickname);
    if (existing) {
      throw new NicknameAlreadyTakenError(nickname);
    }

    const user = User.create(nickname, this.clock, this.idGenerator);
    await this.userRepository.save(user);
    return user;
  }
}

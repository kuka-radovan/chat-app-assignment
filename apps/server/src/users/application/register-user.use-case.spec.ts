import { FixedClock } from '../../common/clock/testing/fixed-clock';
import { FakeIdGenerator } from '../../common/id/testing/fake-id-generator';
import { NicknameAlreadyTakenError } from '../domain/errors';
import { RegisterUserUseCase } from './register-user.use-case';
import { InMemoryUserRepository } from './testing/in-memory-user.repository';

function buildRegisterUser(
  repository: InMemoryUserRepository,
): RegisterUserUseCase {
  return new RegisterUserUseCase(
    repository,
    new FixedClock(new Date('2026-06-20T12:00:00.000Z')),
    new FakeIdGenerator(),
  );
}

describe('RegisterUserUseCase', () => {
  it('registers a new user', async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = buildRegisterUser(repository);

    const user = await registerUser.execute('alice');

    expect(user.nickname.value).toBe('alice');
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(await repository.findByNickname(user.nickname)).toBe(user);
  });

  it('fails when nickname is already taken', async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = buildRegisterUser(repository);

    await registerUser.execute('alice');

    await expect(registerUser.execute('alice')).rejects.toBeInstanceOf(
      NicknameAlreadyTakenError,
    );
  });

  it('maps a save-time nickname collision to NicknameAlreadyTakenError', async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = buildRegisterUser(repository);

    const first = await registerUser.execute('alice');

    jest.spyOn(repository, 'findByNickname').mockResolvedValueOnce(null);

    await expect(registerUser.execute('alice')).rejects.toBeInstanceOf(
      NicknameAlreadyTakenError,
    );

    expect(await repository.findByNickname(first.nickname)).toBe(first);
  });
});

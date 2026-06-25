import { NicknameAlreadyTakenError } from '../domain/value-objects/nickname';
import { RegisterUserUseCase } from './register-user.use-case';
import { InMemoryUserRepository } from './testing/in-memory-user.repository';

describe('RegisterUserUseCase', () => {
  it('registers a new user', async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = new RegisterUserUseCase(repository);

    const user = await registerUser.execute('alice');

    expect(user.nickname.value).toBe('alice');
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(await repository.findByNickname(user.nickname)).toBe(user);
  });

  it('fails when nickname is already taken', async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = new RegisterUserUseCase(repository);

    await registerUser.execute('alice');

    await expect(registerUser.execute('alice')).rejects.toBeInstanceOf(
      NicknameAlreadyTakenError,
    );
  });

  it('maps a save-time nickname collision to NicknameAlreadyTakenError', async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = new RegisterUserUseCase(repository);

    const first = await registerUser.execute('alice');

    jest.spyOn(repository, 'findByNickname').mockResolvedValueOnce(null);

    await expect(registerUser.execute('alice')).rejects.toBeInstanceOf(
      NicknameAlreadyTakenError,
    );

    expect(await repository.findByNickname(first.nickname)).toBe(first);
  });
});

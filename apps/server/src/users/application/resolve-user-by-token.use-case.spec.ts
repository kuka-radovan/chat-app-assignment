import { FixedClock } from '../../common/clock/testing/fixed-clock';
import { FakeIdGenerator } from '../../common/id/testing/fake-id-generator';
import { InvalidAuthTokenError } from '../domain/value-objects/auth-token';
import { RegisterUserUseCase } from './register-user.use-case';
import { ResolveUserByTokenUseCase } from './resolve-user-by-token.use-case';
import { InMemoryUserRepository } from './testing/in-memory-user.repository';

describe('ResolveUserByTokenUseCase', () => {
  it('returns the user for a valid token', async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = new RegisterUserUseCase(
      repository,
      new FixedClock(new Date('2026-06-20T12:00:00.000Z')),
      new FakeIdGenerator(),
    );
    const resolveUser = new ResolveUserByTokenUseCase(repository);

    const user = await registerUser.execute('alice');

    await expect(resolveUser.execute(user.token.value)).resolves.toBe(user);
  });

  it('returns null when the token is unknown', async () => {
    const repository = new InMemoryUserRepository();
    const resolveUser = new ResolveUserByTokenUseCase(repository);

    await expect(
      resolveUser.execute('11111111-1111-4111-8111-111111111111'),
    ).resolves.toBeNull();
  });

  it('rejects an invalid token format', async () => {
    const repository = new InMemoryUserRepository();
    const resolveUser = new ResolveUserByTokenUseCase(repository);

    await expect(resolveUser.execute('not-a-uuid')).rejects.toBeInstanceOf(
      InvalidAuthTokenError,
    );
  });
});

import { ListUsersUseCase } from './list-users.use-case';
import { RegisterUserUseCase } from './register-user.use-case';
import { InMemoryUserRepository } from './testing/in-memory-user.repository';

describe('ListUsersUseCase', () => {
  it('returns an empty list when no users are registered', async () => {
    const repository = new InMemoryUserRepository();
    const listUsers = new ListUsersUseCase(repository);

    await expect(listUsers.execute()).resolves.toEqual([]);
  });

  it('returns all registered users ordered by registration time', async () => {
    const repository = new InMemoryUserRepository();
    const registerUser = new RegisterUserUseCase(repository);
    const listUsers = new ListUsersUseCase(repository);

    const alice = await registerUser.execute('alice');
    const bob = await registerUser.execute('bob');

    const users = await listUsers.execute();

    expect(users).toEqual([alice, bob]);
    expect(users.map((user) => user.nickname.value)).toEqual(['alice', 'bob']);
  });
});

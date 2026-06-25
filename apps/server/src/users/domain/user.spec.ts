import { AuthToken } from './value-objects/auth-token';
import { Nickname } from './value-objects/nickname';
import { UserId } from './value-objects/user-id';
import { User } from './user';

describe('User', () => {
  it('creates a user with generated id, token, and timestamp', () => {
    const nickname = Nickname.from('alice');
    const before = Date.now();

    const user = User.create(nickname);

    expect(user.nickname).toBe(nickname);
    expect(user.id).toBeInstanceOf(UserId);
    expect(user.token).toBeInstanceOf(AuthToken);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('reconstitutes a user from persisted values', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z');
    const user = User.reconstitute({
      id: UserId.from('11111111-1111-4111-8111-111111111111'),
      nickname: Nickname.from('alice'),
      token: AuthToken.from('22222222-2222-4222-8222-222222222222'),
      createdAt,
    });

    expect(user.id.value).toBe('11111111-1111-4111-8111-111111111111');
    expect(user.nickname.value).toBe('alice');
    expect(user.token.value).toBe('22222222-2222-4222-8222-222222222222');
    expect(user.createdAt).toBe(createdAt);
  });
});

import { FakeIdGenerator } from '../../../common/id/testing/fake-id-generator';
import { AuthToken, InvalidAuthTokenError } from './auth-token';

describe('AuthToken', () => {
  it('generates a valid UUID', () => {
    const token = AuthToken.generate(new FakeIdGenerator());
    expect(AuthToken.from(token.value)).toEqual(token);
  });

  it('rejects invalid token strings', () => {
    expect(() => AuthToken.from('not-a-uuid')).toThrow(InvalidAuthTokenError);
    expect(() => AuthToken.from('')).toThrow(InvalidAuthTokenError);
  });
});

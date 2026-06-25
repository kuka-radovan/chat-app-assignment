import { UserId } from './user-id';

describe('UserId', () => {
  it('generates a valid UUID', () => {
    const id = UserId.generate();
    expect(UserId.from(id.value)).toEqual(id);
  });

  it('rejects invalid id strings', () => {
    expect(() => UserId.from('not-a-uuid')).toThrow(
      'Invalid user id: not-a-uuid',
    );
    expect(() => UserId.from('')).toThrow('Invalid user id: ');
  });
});

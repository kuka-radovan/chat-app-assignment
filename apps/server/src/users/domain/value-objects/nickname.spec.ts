import { config } from '../../../config';
import { InvalidNicknameError, Nickname } from './nickname';

describe('Nickname', () => {
  it('accepts valid nicknames', () => {
    expect(Nickname.from('alice').value).toBe('alice');
    expect(Nickname.from('  bob_1  ').value).toBe('bob_1');
    expect(Nickname.from('user-name').value).toBe('user-name');
  });

  it('rejects empty nicknames', () => {
    expect(() => Nickname.from('')).toThrow(InvalidNicknameError);
    expect(() => Nickname.from('   ')).toThrow(InvalidNicknameError);
  });

  it('rejects nicknames that are too long', () => {
    const tooLong = 'a'.repeat(config.NICKNAME_MAX_LENGTH + 1);
    expect(() => Nickname.from(tooLong)).toThrow(InvalidNicknameError);
  });

  it('rejects nicknames with invalid characters', () => {
    expect(() => Nickname.from('hello world')).toThrow(InvalidNicknameError);
    expect(() => Nickname.from('alice!')).toThrow(InvalidNicknameError);
  });
});

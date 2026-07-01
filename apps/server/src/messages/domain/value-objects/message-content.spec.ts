import { MESSAGE_MAX_LENGTH } from '../../../config';
import {
  MessageContent,
  MessageEmptyError,
  MessageTooLongError,
} from './message-content';

describe('MessageContent', () => {
  it('accepts trimmed content', () => {
    const content = MessageContent.from('  hello  ');

    expect(content.value).toBe('hello');
  });

  it('rejects empty content', () => {
    expect(() => MessageContent.from('   ')).toThrow(MessageEmptyError);
  });

  it('rejects content that is too long', () => {
    const tooLong = 'a'.repeat(MESSAGE_MAX_LENGTH + 1);
    expect(() => MessageContent.from(tooLong)).toThrow(MessageTooLongError);
  });
});

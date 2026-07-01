import { UserId } from '../../users/domain/value-objects/user-id';
import { Message } from './message';
import { MessageContent } from './value-objects/message-content';

describe('Message', () => {
  it('creates a message', () => {
    const authorId = UserId.from('550e8400-e29b-41d4-a716-446655440000');

    const message = Message.create(authorId, MessageContent.from('hello'));

    expect(message.authorId).toBe(authorId);
    expect(message.content.value).toBe('hello');
    expect(message.createdAt).toBeInstanceOf(Date);
  });
});

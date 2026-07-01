import { Nickname } from '../../users/domain/value-objects/nickname';
import { UserId } from '../../users/domain/value-objects/user-id';
import { Message } from './message';
import { MessageAuthor } from './value-objects/message-author';
import { MessageContent } from './value-objects/message-content';
import { MessageId } from './value-objects/message-id';

describe('Message', () => {
  it('creates a message with generated id and timestamp', () => {
    const authorId = UserId.from('550e8400-e29b-41d4-a716-446655440000');
    const before = Date.now();

    const message = Message.create(authorId, MessageContent.from('hello'));

    expect(message.author.id).toBe(authorId);
    expect(message.author.nickname).toBeNull();
    expect(message.content.value).toBe('hello');
    expect(message.id).toBeInstanceOf(MessageId);
    expect(message.createdAt).toBeInstanceOf(Date);
    expect(message.createdAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('reconstitutes a message from persisted values', () => {
    const createdAt = new Date('2026-06-20T12:00:00.000Z');
    const authorId = UserId.from('22222222-2222-4222-8222-222222222222');
    const message = Message.reconstitute({
      id: MessageId.from('11111111-1111-4111-8111-111111111111'),
      author: MessageAuthor.create(authorId, Nickname.from('alice')),
      content: MessageContent.from('hello'),
      createdAt,
    });

    expect(message.id.value).toBe('11111111-1111-4111-8111-111111111111');
    expect(message.author.id.value).toBe(
      '22222222-2222-4222-8222-222222222222',
    );
    expect(message.author.nickname?.value).toBe('alice');
    expect(message.content.value).toBe('hello');
    expect(message.createdAt).toBe(createdAt);
  });
});

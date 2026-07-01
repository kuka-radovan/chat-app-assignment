import { UserId } from '../../users/domain/value-objects/user-id';
import { ListMessagesUseCase } from './list-messages.use-case';
import { SendMessageUseCase } from './send-message.use-case';
import { InMemoryMessageRepository } from './testing/in-memory-message.repository';

describe('ListMessagesUseCase', () => {
  it('returns an empty list when no messages exist', async () => {
    const repository = new InMemoryMessageRepository();
    const listMessages = new ListMessagesUseCase(repository);

    await expect(listMessages.execute()).resolves.toEqual([]);
  });

  it('returns all messages with author nicknames ordered by creation time', async () => {
    const authorId = UserId.from('550e8400-e29b-41d4-a716-446655440000');
    const repository = new InMemoryMessageRepository(
      new Map([[authorId.value, 'alice']]),
    );

    const sendMessage = new SendMessageUseCase(repository);
    const listMessages = new ListMessagesUseCase(repository);

    const first = await sendMessage.execute({ authorId, content: 'first' });
    const second = await sendMessage.execute({ authorId, content: 'second' });

    const messages = await listMessages.execute();

    expect(messages).toHaveLength(2);

    const firstMessage = messages[0];
    const secondMessage = messages[1];

    expect(firstMessage.id).toBe(first.id);
    expect(firstMessage.author.id).toBe(authorId);
    expect(firstMessage.author.nickname?.value).toBe('alice');
    expect(firstMessage.content.value).toBe('first');
    expect(firstMessage.createdAt).toBe(first.createdAt);

    expect(secondMessage.id).toBe(second.id);
    expect(secondMessage.author.id).toBe(authorId);
    expect(secondMessage.author.nickname?.value).toBe('alice');
    expect(secondMessage.content.value).toBe('second');
    expect(secondMessage.createdAt).toBe(second.createdAt);
  });
});
